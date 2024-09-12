### Kontent.ai - Schedule Unpublish Webhook Script

This webhook script is no longer needed, the latest product update introduced this feature.

Why: ~~In Kontent.ai UI, it is currently possible to schedule unpublishing only if the article has already been published. If the editor needs to schedule both publishing and unpublishing, it is not supported, yet. Utilizing this webhook resolves this. ~~

How: In UI, you just need to extend your content type with the date element dedicated to unpublishing and set up this webhook that reacts to the publish event. The moment that scheduled item gets published, the webhook will schedule also its unpublishing from the unpublish date element. 

**Build command**
`npm i xhr2`

**Run**
`node schedule_unpublish.js`
