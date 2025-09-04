---
trigger: always_on
---

Canvas Team 4
A team of four developers, consisting of two front-end developers (React, MUI) and two back-end developers (Node.js, MongoDB, Google Auth, Google Cloud Storage), is delivering an application through four agile sprints: two weeks for UX research, two weeks for UI design, and four weeks for development and deployment.



Description

“ArtHive is a creative platform designed for artists of all levels who want inspiration and community. Each week, the app sends out a unique art challenge to spark creativity and encourage participation. Artists can upload their work, explore others’ submissions, and engage with the community through feedback and support. By combining structured challenges with a collaborative space, ArtHive helps artists stay motivated, improve their skills, and share their creativity with a wider audience.”


 Objective

Who is it for? (Target Users)

* Who will use ArtHive and why?
    * "ArtHive is for everyone of all skill levels — from amateurs, professionals, and students to creative hobbyists — who want to improve their craft through consistent challenges and are looking for inspiration and fresh ideas."



What problem does it solve? (Pain Point)

* What challenge or frustration are we addressing?
    * "Many artists struggle to stay motivated and inspired, have their work buried under unrelated posts on social media, and rarely receive constructive exposure without an existing following — ArtHive offers a dedicated space where anyone can share artwork based on specific art topics."



Why does it matter? (Value / Impact)

* Why will this solution make a difference?
    * "Consistent creative practice in a supportive environment helps artists develop their skills, build confidence, and connect globally."



Optional Hook / Relatable Story / Motivation / Catching phrase

* How can we make the problem relatable?
    * "Ever stared at a blank canvas with no idea what to draw, or posted your art only for it to disappear in the feed. ArtHive changes that."
    * "Art block can be frustrating. You sit down to create, but no ideas come, and your materials just sit there unused. ArtHive’s weekly prompts give artists a reason to pick up the brush or tablet again, and the community feedback helps turn that small spark into lasting motivation."



User Stories

* (Front-End) Settings
    * Define a reusable MUI parent layout 
        * For each page, implement its layout and define a grid system
* (Back-End) Database
    * Set up MongoDB

Participants / Artists

1. User authentication

    * As a participant, I want to sign in so that I can enter the weekly challenge and upload my artwork for the challenge.
        * Acceptance Criteria: 
            * Users can login with their google account.
            * Users can login using JWT



1. View Weekly Challenge Prompt

    * As a participant, I want to see the current weekly challenge prompt so that I know what to create for the week.
        * Acceptance Criteria: 
            * Prompt is displayed to all visitors without login.
            * Challenge topic and description are displayed on the challenge page.
            * Challenge start and end dates are visible.
            * Challenge rules/guidelines are visible.
            * If no challenge is active, a “No active challenge” message is shown.

1. Submit Artwork

    * As a participant, I want to submit my artwork, providing my name and social media link, so that I can participate quickly and share my work.
        * Acceptance Criteria: 
            * User needs to login or sign up to upload the submission form
            * User can select JPG or PNG files up to 15MB?
            * A preview of the selected image is shown before submission.
            * Submission button is disabled until an image is selected.
            * Artwork is added to the challenge gallery after successful submission.
            * If upload fails, a clear error message is displayed.
            * If submission deadline has passed, upload option is disabled with a “Challenge closed” message.
            * Name and social media link are optional?
            * Submission saved in database
            * User cannot submit multiple entries if the challenge allows only one (or system warns if limit exceeded)

1. View Submitted Artwork

    * As a participant, I want to see my uploaded artwork immediately so that I can confirm submission success.
        * Acceptance Criteria: 
            * participant sees their artwork immediately
            * Participant sees a success message("Your artwork has been submitted")
            * Brings user back to the gallery page, and they will see their submitted artwork.
            * User cannot submit multiple entries if the challenge allows only one (or system warns if limit exceeded)

1. Browse Gallery & Interact

    * As a participant, I want to view other participants’ submissions and vote/like them so that I can engage with the community. 
        * Acceptance Criteria: 
            * A list of artwork post displays a image of artwork, title, and amount of likes
            * Gallery displays all challenge submissions sorted by upload date (default).
            * Each post is clickable and pop-up detailed page of each artwork.
            * Detailed page displays bigger image of artwork
            * Detailed page includes name and last name
            * Detailed page has title of artwork, art media as a tag, amount of likes, and description.
            * Viewers who are not logged in or do not have permission cannot give likes? (like button is hidden or disabled) votes per user/device/IP limited to 1.

1. Interact with users with likes / vote

    * As a participant, I want to like artworks in the challenge so that I can support other artists.
        * Acceptance Criteria: 
            * Logged-in users can click a like button on any artwork.
            * Like count updates immediately after clicking.
            * Each user can like each artwork only once? or multiple

1. View Top 5 Artworks

    * As a participant, I want to see the top 5 artworks ranked by votes so that I know which submissions are popular.
        * Acceptance Criteria: 
            * Top 5 artworks displayed based on votes/likes.
            * each post displays title, amount of likes, and image.
            * each post has detailed page which is pop up once it’s clicked.
            * each detailed page shows name, last name, title, description, art media, and amount of likes.



Admin

1. Create Weekly Challenge Prompt

    * As an admin, I want to create a new weekly challenge prompt so that participants can see it and submit artworks.
        * Acceptance Criteria: 
            * Admin can create a new challenge prompt by entering:
            * Challenge title
            * Description
            * Start date
            * End date

1. Edit Weekly Challenge Prompt

    * As an admin, I want to edit an existing weekly challenge prompt so that I can update or improve it.
        * Acceptance Criteria: 
            * Admin can edit any active or upcoming challenge prompt.
            * Admin can delete a challenge prompt (system asks for confirmation before deletion).

1. Delete Inappropriate Artwork

    * As an admin, I want to delete submissions that violate guidelines so that the gallery remains appropriate and relevant.
        * Acceptance Criteria: 
            * Admin can view a list of all submissions for the current challenge.
            * Admin can delete inappropriate submissions
            * Artist notified of deletion
            * Only admins can access the deletion feature.
            * Artwork removed from gallery.

1. Security of Admin tool

    *  As an admin, I want to ensure that only authorized users can access admin tools so that management features remain secure and protected from misuse. 
        * Acceptance Criteria:
            * Admin actions are protected from non-admin participants.
            * If a non-admin attempts to access admin tools, they see an “Access Denied” message.
            * Only admins can access the prompt management interface (restricted via authentication/authorization - is_admin).


