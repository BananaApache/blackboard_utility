# Blackboard Utility Chrome Extension

[Chrome Web Store Link](https://chromewebstore.google.com/detail/blackboard-utility/jocjidmokopimmpngmmfabdhmmphheej)

Blackboard Utility is a Chrome extension designed to bridge the gap between Blackboard Learn, CaneLink, and RateMyProfessors. Currently only designed for University of Miami students. This extension includes a centralized academic dashboard that can automate document management, display real-time schedule data, and provides instant RateMyProfessor ratings.

### Features

* One-Click Course Download: Automatically finds and downloads all files and folders from a course. Includes submissions, assignments, course documents, syllabus!
* Assignment Backup: Downloads all previous assignment submissions for a local record
* Professor Ratings: Shows RateMyProfessors scores directly on Blackboard and search pages
* Schedule Integration: Pulls daily class times and locations from CaneLink and display it inside extension
* Dining Dollars: Shows current meal plan balances without needing to log into a separate portal
* Class Roster: Displays a list of students and instructors in the current course
* Overlap Finder: Identifies students who share multiple classes with the user
* Ongoing Classes: Uses a database to show what classes are happening on campus in real-time
* Class Search: Uses CaneLink to allow users to search for classes right inside of blackboard

### Some design tradeoffs

* The file downloads items one by one. This is slower than downloading everything at once, but it prevents the University servers from blocking the user for too many simultaneous requests
* The extension does not store passwords! As long as the user's session has not expired, the extension features will keep on working
* The list of all campus classes is stored in a static file. This makes the search very fast and work offline, but it requires a manual update every semester to reflect the new course catalog

### Permissions and Privacy
* The extension requires access to miami.edu sites to read schedule and dining data. All data stays on the user's computer and is never sent to external servers.

### Development Notes

* Hardcoded term value `current_term = "2258"` must change each semester
* `classes_spring2024.json` must be regenerated from course catalog

---

Created by Daniel Li. This extension is free for everyone and entirely open source! :)
