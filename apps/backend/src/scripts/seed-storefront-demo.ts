import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

const demoListings = [
  {
    id: 'lst_demo_storefront_001',
    print_id: 'demo_pokemon_pikachu_sv1_001',
    price_amount: 24.99,
    condition_code: 'near_mint',
    quantity_available: 2,
    seller_note: 'Demo storefront listing: Pikachu style card for local buyer flow testing.',
    photo: 'https://images.pokemontcg.io/sv1/001_hires.png'
  },
  {
    id: 'lst_demo_storefront_002',
    print_id: 'demo_pokemon_charizard_obf_223',
    price_amount: 89.99,
    condition_code: 'lightly_played',
    quantity_available: 1,
    seller_note: 'Demo storefront listing: Charizard style card for cart testing.',
    photo: 'https://images.pokemontcg.io/obf/223_hires.png'
  },
  {
    id: 'lst_demo_storefront_003',
    print_id: 'demo_yugioh_blue_eyes_sdk_001',
    price_amount: 39.5,
    condition_code: 'excellent',
    quantity_available: 3,
    seller_note: 'Demo storefront listing: Blue-Eyes style card for marketplace testing.',
    photo: 'https://images.ygoprodeck.com/images/cards/89631139.jpg'
  },
  {
    id: 'lst_demo_storefront_004',
    print_id: 'demo_mtg_black_lotus_2ed',
    price_amount: 199.99,
    condition_code: 'played',
    quantity_available: 1,
    seller_note: 'Demo storefront listing: MTG style card for high-value listing layout testing.',
    photo: 'https://cards.scryfall.io/large/front/3/3/33f4f2d3-cb07-4f96-b7b5-11c1d76c4f72.jpg'
  }
]

export default async function seedStorefrontDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  logger.info('=== Storefront demo data seed ===')

  const {
    rows: [seller]
  } = await pg.raw(`
    select id, name
    from seller
    where upper(coalesce(store_status, '')) = 'ACTIVE'
    order by created_at desc
    limit 1
  `)

  if (!seller?.id) {
    throw new Error('No ACTIVE seller found. Run the main backend seed first.')
  }

  const {
    rows: [shippingProfile]
  } = await pg.raw(
    `
      select id
      from shipping_profile
      where name like ?
      order by created_at desc
      limit 1
    `,
    [`${seller.id}:%`]
  )

  const {
    rows: [fallbackShippingProfile]
  } = await pg.raw(`
    select id
    from shipping_profile
    order by created_at desc
    limit 1
  `)

  const shippingProfileId = shippingProfile?.id || fallbackShippingProfile?.id || null

  const { rows: variants } = await pg.raw(
    `
      select
        v.id as variant_id,
        v.title as variant_title,
        p.id as product_id,
        p.title as product_title
      from product_variant v
      join product p on p.id = v.product_id
      join seller_seller_product_product spp on spp.product_id = p.id
      where spp.seller_id = ?
        and spp.deleted_at is null
        and p.deleted_at is null
        and v.deleted_at is null
        and p.status = 'published'
      order by p.created_at desc, v.created_at desc
      limit ?
    `,
    [seller.id, demoListings.length]
  )

  if (variants.length < demoListings.length) {
    throw new Error(
      `Not enough product variants for demo listings. Needed ${demoListings.length}, found ${variants.length}.`
    )
  }

  for (const [index, demo] of demoListings.entries()) {
    const variant = variants[index]

    await pg.raw(
      `
        insert into listing (
          id,
          print_id,
          product_variant_id,
          seller_id,
          price_amount,
          currency_code,
          condition_code,
          quantity_available,
          status,
          seller_note,
          photos,
          location_country,
          shipping_profile_id,
          raw_price_amount,
          created_at,
          updated_at
        )
        values (
          ?,
          ?,
          ?,
          ?,
          ?,
          'eur',
          ?,
          ?,
          'active',
          ?,
          ?::jsonb,
          'ES',
          ?,
          ?::jsonb,
          now(),
          now()
        )
        on conflict (id) do update set
          print_id = excluded.print_id,
          product_variant_id = excluded.product_variant_id,
          seller_id = excluded.seller_id,
          price_amount = excluded.price_amount,
          currency_code = excluded.currency_code,
          condition_code = excluded.condition_code,
          quantity_available = excluded.quantity_available,
          status = excluded.status,
          seller_note = excluded.seller_note,
          photos = excluded.photos,
          location_country = excluded.location_country,
          shipping_profile_id = excluded.shipping_profile_id,
          raw_price_amount = excluded.raw_price_amount,
          updated_at = now(),
          deleted_at = null
      `,
      [
        demo.id,
        demo.print_id,
        variant.variant_id,
        seller.id,
        demo.price_amount,
        demo.condition_code,
        demo.quantity_available,
        demo.seller_note,
        JSON.stringify([demo.photo]),
        shippingProfileId,
        JSON.stringify({
          amount: demo.price_amount,
          currency_code: 'eur',
          source: 'storefront-demo-seed'
        })
      ]
    )

    logger.info(
      `Seeded ${demo.id} -> ${demo.print_id} / variant ${variant.variant_id}`
    )
  }

  logger.info(`Seller: ${seller.id} (${seller.name})`)
  logger.info(`Shipping profile: ${shippingProfileId || 'none'}`)
  logger.info('=== Storefront demo data seed finished ===')
}
