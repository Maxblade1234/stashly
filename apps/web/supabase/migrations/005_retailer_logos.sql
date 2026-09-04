-- 005_retailer_logos.sql
-- Point each seeded retailer at the brand artwork shipped with the web app
-- (apps/web/public/images/brands). RetailerCard falls back to a letter avatar
-- when logo_url is null, which is what the original seed produced.
update public.retailers set logo_url = '/images/brands/apple.png'        where name = 'Apple';
update public.retailers set logo_url = '/images/brands/chipotle.png'     where name = 'Chipotle';
update public.retailers set logo_url = '/images/brands/dominos.png'      where name = 'Dominos';
update public.retailers set logo_url = '/images/brands/riot-games.png'   where name = 'Riot Games';
update public.retailers set logo_url = '/images/brands/ebay.png'         where name = 'eBay';
update public.retailers set logo_url = '/images/brands/new-era.png'      where name = 'New Era';
update public.retailers set logo_url = '/images/brands/nfl-shop.png'     where name = 'NFL Shop';
update public.retailers set logo_url = '/images/brands/jersey-mikes.png' where name = 'Jersey Mikes';
update public.retailers set logo_url = '/images/brands/off-season.png'   where name = 'Off Season';
update public.retailers set logo_url = '/images/brands/fanatics.png'     where name = 'Fanatics';
