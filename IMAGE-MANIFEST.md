# Marque One — Image Manifest

This manifest documents every image slot on the site, its required aspect ratio, location, and what subject matter it must depict when photography is supplied by the client.

## Homepage (`/`)

| Slot Key | Aspect Ratio | Section | Description / Subject | Current Status |
|---|---|---|---|---|
| `homeHero` | 16:9 | §1 Hero | High-altitude/aerial motion shot of the 219-acre estate and surrounding landscape | Uses `hero.mp4` video placeholder |
| `circuitTrace` | 21:9 | §3 Circuit | High-resolution circuit trace vector or graphic of the 3.2 km layout | Integrated (`racetrack_drive.png`) |
| `surfaceCircuit` | 3:2 | §4 Surfaces | Performance car on the main circuit / drag strip standing start | Integrated (`carousel_drive.png`) |
| `surfaceOffroad` | 3:2 | §4 Surfaces | 4x4 vehicle navigating natural rock and elevation course | **Placeholder** (`off-road-course.jpg`) |
| `surfaceSkidpan` | 3:2 | §4 Surfaces | Vehicle undergoing low-grip drift on skid pan | **Placeholder** (`skid-pan.jpg`) |
| `surfaceKickplate` | 3:2 | §4 Surfaces | Vehicle encountering lateral kick plate destabilisation | **Placeholder** (`kick-plate.jpg`) |
| `surfaceWetTrack` | 3:2 | §4 Surfaces | Sports car on wet handling track with water sprays | **Placeholder** (`wet-handling.jpg`) |
| `onYourOwn` | 16:9 | §6 On Your Own | Single road car receiving instruction / driving on circuit | Integrated (`carousel_push.png`) |
| `withPeople` | 16:9 | §7 With People | Group of guests / car club enjoying clubhouse and pit area | Integrated (`hero_club_moment.png`) |
| `hospitalityClubhouse` | 16:9 | §10 Hospitality | Architectural wide shot of the 40-room clubhouse facing circuit | Integrated (`home_hospitality_clubhouse_1786900669787.png`) |
| `hospitalityPool` | 4:3 | §10 Hospitality | Infinity pool overlooking the race circuit | Integrated (`home_hospitality_pool_1786900861087.png`) |
| `hospitalitySpa` | 4:3 | §10 Hospitality | Spa treatment room and wellness gym interior | Integrated (`home_hospitality_spa_1786950697112.jpg`) |
| `hospitalityWeekend` | 4:3 | §10 Hospitality | Luxury guest suite overlooking the circuit at sunset | Integrated (`home_hospitality_weekend_1786950925476.jpg`) |
| `locationMap` | 16:9 | §12 Location | Stylised map graphic showing 2-hour proximity to Bengaluru airport | **Placeholder** (`location-map.svg`) |

## About Page (`/about`)

| Slot Key | Aspect Ratio | Section | Description / Subject | Current Status |
|---|---|---|---|---|
| `aboutHeader` | 21:9 | Header | Panoramic vista of the road at Marque One at golden hour | Integrated (`final_road.png`) |

---

## Instructions for replacing placeholders

To supply photography for a placeholder slot:
1. Crop/resize photo to match the target aspect ratio.
2. Save file under `public/assets/images/` with the filename listed in **Description**.
3. Update `src/data/images.js` by setting `src: '/assets/images/YOUR_FILENAME.jpg'` for the corresponding key.
