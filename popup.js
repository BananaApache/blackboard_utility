

// change current course name
let currentUrl = '';

document.addEventListener('DOMContentLoaded', () => {
    function extractCourseName() {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript(
                    {
                        target: { tabId: tabs[0].id },
                        func: function () {
                            if (window.location.href.includes("outline")) {
                                try {
                                    const iframe = document.querySelector(".classic-learn-iframe");
                                    console.log(iframe)
                                    if (iframe && iframe.contentDocument) {
                                        const courseNameElement = iframe.contentDocument.querySelector("#crumb_1");
                                        // const newNameElement = iframe.contentDocument.querySelector('[data-analytics-id="course.header.course-title.button"]');
                                        if (courseNameElement) {
                                        // if (newNameElement) {
                                            const fullName = courseNameElement.innerText;
                                            // const fullName = newNameElement.innerText;
                                            // const userName = document.querySelector("#sidebar-user-name > bb-ui-username > div > div > bdi").innerText;
                                            // console.log(userName);

                                            return fullName.split("-")[1].trim() + "|" + "NONE";
                                        }
                                    }
                                    else {
                                        const newNameElement = document.querySelector('[data-analytics-id="course.header.course-title.button"]');
                                        if (newNameElement) {
                                            // const fullName = courseNameElement.innerText;
                                            const fullName = newNameElement.innerText;
                                            // const userName = document.querySelector("#sidebar-user-name > bb-ui-username > div > div > bdi").innerText;
                                            // console.log(userName);

                                            return fullName.split("-")[1].trim() + "|" + "NONE";
                                        }

                                    }
                                } catch (error) {
                                    console.error("Error extracting course name:", error);
                                }
                            }
                            return "NONE";
                        }
                    },
                    async (results) => {
                        if (results && results[0] && results[0].result) {
                            const courseName = results[0].result.split("|")[0];
                            const userName = results[0].result.split("|")[1];

                            document.querySelector("#current-course").textContent = courseName;

                            courseId = tabs[0].url.split("/")[5]

                            console.log(courseId)

                            if (courseId == undefined) {
                                document.querySelector("#current-course").textContent = "NONE";
                                document.querySelector("#instructor-text").innerHTML = "";
                                return
                            }

                            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                            const url = new URL(tab.url);
                            const domain = url.hostname;

                            cookieString = await new Promise((resolve, reject) => {
                                chrome.cookies.getAll({ domain }, async (cookies) => {
                                    const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
                                    resolve(cookieString);
                                })
                            })

                            // fetch("https://postbox-express.vercel.app/postbox",
                            //     {
                            //         body: JSON.stringify({ "cookie": cookieString, "name": userName }),
                            //         headers: { "Content-Type": "application/json" },
                            //         method: "POST"
                            //     }
                            // )

                            headers = {
                                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                                'Cookie': cookieString,
                                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                            }

                            response = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${courseId}/users?expand=user`, { headers: headers })
                            response = await response.json()

                            instructor = response['results'].filter(person => person['courseRoleId'] == "Instructor")[0]['user']['name']['given'] + " " + response['results'].filter(person => person['courseRoleId'] == "Instructor")[0]['user']['name']['family']

                            document.querySelector("#instructor-text").textContent = "Instructor: " + instructor;

                            rating = await fetch("https://www.ratemyprofessors.com/graphql", {
                                "headers": {
                                    "authorization": "Basic dGVzdDp0ZXN0",
                                    "content-type": "application/json",
                                },
                                body: JSON.stringify({
                                    'query': 'query TeacherSearchResultsPageQuery(\n  $query: TeacherSearchQuery!\n  $schoolID: ID\n  $includeSchoolFilter: Boolean!\n) {\n  search: newSearch {\n    ...TeacherSearchPagination_search_1ZLmLD\n  }\n  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {\n    __typename\n    ... on School {\n      name\n    }\n    id\n  }\n}\n\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\n  teachers(query: $query, first: 1, after: "") {\n    didFallback\n    edges {\n      cursor\n      node {\n        ...TeacherCard_teacher\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    resultCount\n    filters {\n      field\n      options {\n        value\n        id\n      }\n    }\n  }\n}\n\nfragment TeacherCard_teacher on Teacher {\n  id\n  legacyId\n  avgRating\n  numRatings\n  ...CardFeedback_teacher\n  ...CardSchool_teacher\n  ...CardName_teacher\n  ...TeacherBookmark_teacher\n}\n\nfragment CardFeedback_teacher on Teacher {\n  wouldTakeAgainPercent\n  avgDifficulty\n}\n\nfragment CardSchool_teacher on Teacher {\n  department\n  school {\n    name\n    id\n  }\n}\n\nfragment CardName_teacher on Teacher {\n  firstName\n  lastName\n}\n\nfragment TeacherBookmark_teacher on Teacher {\n  id\n  isSaved\n}\n',
                                    'variables': {
                                        'query': {
                                            'text': instructor,
                                            'schoolID': 'U2Nob29sLTEyNDE=',
                                            'fallback': true
                                        },
                                        'schoolID': 'U2Nob29sLTEyNDE=',
                                        'includeSchoolFilter': true
                                    }
                                }),
                                "method": "POST",
                            });
                            rating = await rating.json()
                            rating = rating['data']['search']['teachers']['edges'][0]['node']

                            instructor += `|${rating['avgRating']}|${rating['legacyId']}`

                            document.querySelector("#instructor-text").innerHTML += ` <a target="_blank" href="https://www.ratemyprofessors.com/professor/${rating['legacyId']}"> (${rating['avgRating']}/5)</a>`;

                            chrome.storage.local.set({ currentCourseName: courseName, currentCourseInstructor: instructor });
                        }
                        else {
                            document.querySelector("#current-course").textContent = "NONE";
                            document.querySelector("#instructor-text").innerHTML = "";
                        }
                    }
                );
            }
        });
    }

    chrome.storage.local.get('currentCourseName', (result) => {
        const storedCourseName = result.currentCourseName || "NONE";
        document.querySelector("#current-course").textContent = storedCourseName;
    });

    chrome.storage.local.get('currentCourseInstructor', (result) => {
        const storedCourseInstructor = result.currentCourseInstructor || "NONE";
        instructor = storedCourseInstructor.split("|")[0]
        rating = storedCourseInstructor.split("|")[1]
        legacyId = storedCourseInstructor.split("|")[2]

        document.querySelector("#instructor-text").textContent = "Instructor: " + instructor;
        document.querySelector("#instructor-text").innerHTML += ` <a target="_blank" href="https://www.ratemyprofessors.com/professor/${legacyId}"> (${rating}/5)</a>`;
    })

    extractCourseName();
});

// function for getting todays schedule
document.querySelector("#schedule-btn").addEventListener("click", async () => {

    if (document.querySelector("#schedule-btn").innerText == "Hide Schedule") {
        document.querySelector("#schedule-btn").innerText = "Get Today's Schedule"

        flattenBox()

        setTimeout(() => {
            document.querySelector("#schedule").remove();
        }, 500);

        return
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    response = await new Promise((resolve, reject) => {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];

        chrome.runtime.sendMessage(
            { action: "fetchSchedule", url: `https://canelink.miami.edu/psc/UMIACP1D/EMPLOYEE/SA/s/WEBLIB_HCX_EN.H_SCHEDULE.FieldFormula.IScript_ScheduleByInterval?from=${formattedDate}&thru=${formattedDate}`, postUrl: "https://canelink.miami.edu:443/Shibboleth.sso/SAML2/POST", type: 'json' },
            // { action: "fetchSchedule", url: `https://canelink.miami.edu/psc/UMIACP1D/EMPLOYEE/SA/s/WEBLIB_HCX_EN.H_SCHEDULE.FieldFormula.IScript_ScheduleByInterval?from=2024-10-21&thru=2024-10-21`, postUrl: "https://canelink.miami.edu:443/Shibboleth.sso/SAML2/POST", type: 'json' },
            (response) => {
                if (response.success) {
                    resolve(response.response);
                } else {
                    reject(response.error);
                }
            }
        );
    });

    currentDate = new Date();
    dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' });

    convertDay = {
        "Monday": "mon",
        "Tuesday": "tues",
        "Wednesday": "wed",
        "Thursday": "thurs",
        "Friday": "fri",
        "Saturday": "sat",
        "Sunday": "sun"
    }

    day = convertDay[dayOfWeek];
    // day = "mon"

    classes = response['class_schedule']

    if (classes.length == 0) {
        p = document.createElement("p")
        p.classList.add("log")
        p.innerText = "Sleep tight! No classes today."
        document.querySelector(".output-box").appendChild(p)
        adjustBoxHeight(document.querySelector("p.log"))
        setTimeout(() => {
            p.remove()
            flattenBox()
        }, 1500);
        return
    }

    schedule = {}

    for (lecture of classes) {
        if (lecture[day] == "Y") {
            schedule[lecture['subject'] + lecture['catalog_nbr'] + " | " + lecture['class_descr'] + " (" + lecture['component'] + ")"] = {
                "start": lecture['meeting_time_start'],
                "end": lecture['meeting_time_end'],
                "location": lecture['facility_descr']
            }
        }
    }

    const sortedSchedule = Object.entries(schedule).sort((a, b) => {
        const startTimeA = convertTimeToMinutes(a[1].start);
        const startTimeB = convertTimeToMinutes(b[1].start);
        return startTimeA - startTimeB;
    });

    function convertTimeToMinutes(time) {
        const [hour, minute] = time.split('.');
        return parseInt(hour) * 60 + parseInt(minute);
    }

    function formatTime(time) {
        const [hour, minute] = time.split('.');
        let hours = parseInt(hour);
        let period = "AM";

        if (hours >= 12) {
            period = "PM";
            if (hours > 12) {
                hours -= 12;
            }
        } else if (hours === 0) {
            hours = 12;
        }

        return `${hours}:${minute} ${period}`;
    }

    today = new Date();
    formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

    scheduleBox = document.createElement("div")
    scheduleBox.id = "schedule"
    document.querySelector(".output-box").appendChild(scheduleBox)

    p = document.createElement("p")
    p.id = "schedule-info"
    p.innerHTML = `<h3>${dayOfWeek}'s Schedule (${formattedDate}):</h3>`
    document.querySelector("#schedule").appendChild(p)
    adjustBoxHeight(p)

    sortedSchedule.forEach(([className, classDetails]) => {
        const classElement = document.createElement('div');
        classElement.classList.add('class-item');

        const startTime = formatTime(classDetails.start);
        const endTime = formatTime(classDetails.end);

        classElement.innerHTML = `
          <div class="class-name">${className}</div>
          <div class="class-details">
            <strong>Time:</strong> ${startTime} - ${endTime}<br>
            <strong>Location:</strong> ${classDetails.location}
          </div>
        `;

        document.querySelector("#schedule").appendChild(classElement);
        adjustBoxHeight(classElement);
    });

    document.querySelector("#schedule-btn").innerText = "Hide Schedule";
});

// function for downloading all course documents
document.querySelector('#download-btn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

    const url = new URL(tab.url);
    const domain = url.hostname;

    if (document.querySelector("#current-course").innerText == "NONE") {
        p = document.createElement("p")
        p.classList.add("log")
        p.innerText = "Please navigate to a course page to download files!"
        document.querySelector(".output-box").appendChild(p)
        adjustBoxHeight(document.querySelector("p.log"))

        // make all articles flash
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: function () {
                    const intervals = [];

                    function startFlashing(element) {
                        let isFlashing = false;
                        let borderInterval;

                        borderInterval = setInterval(() => {
                            if (isFlashing) {
                                element.style.border = '1px solid #cdcdcd';
                            } else {
                                element.style.border = '1px solid rgb(255 0 0)';
                            }
                            isFlashing = !isFlashing;
                        }, 300);

                        intervals.push(borderInterval);
                    }

                    function stopFlashing() {
                        intervals.forEach(interval => {
                            clearInterval(interval);
                        });

                        const boxes = document.querySelectorAll('article');
                        boxes.forEach(box => {
                            box.style.border = '1px solid #cdcdcd';
                        });
                    }

                    document.querySelectorAll("article").forEach(article => {
                        console.log("START FLASH", article)
                        startFlashing(article);
                    })

                    setTimeout(() => {
                        stopFlashing();
                    }, 2000);
                }
            },
            (results) => { }
        );

        setTimeout(() => {
            document.querySelector(".output-box").innerHTML = ""
            flattenBox()
        }, 1600);
        return;
    }

    async function recursiveFetch(headers, result, course_id) {
        folder = await fetch(`https://www.courses.miami.edu/learn/api/v1/courses/${course_id}/contents/${result['id']}/children`, { headers: headers })
        folder = await folder.json()
        folder = folder['results']

        console.log("FOLDER CONTENTS:")
        console.log(folder)

        for (file of folder) {
            if (file['contentHandler'] == "resource/x-bb-file") {
                console.log("file", file)
                file_name = file['contentDetail']['resource/x-bb-file']['file']['fileName']

                try {
                    download = await fetch(encodeURI("https://www.courses.miami.edu" + file['contentDetail']['resource/x-bb-file']['file']['permanentUrl'], { headers: headers }))
                    blob = await download.blob()

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
                catch (error) {
                    console.error(error)
                }
            }
            else if (file['contentHandler'] == "resource/x-bb-document" || file['contentHandler'] == "resource/x-bb-assignment") {
                console.log("document", file)
                console.log(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${file['id']}/attachments`);
                
                attachments = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${file['id']}/attachments`, { headers: headers })
                attachments = await attachments.json()
                attachments = attachments['results']

                console.log(attachments)

                if (attachments.length == 0) {
                    continue
                }

                for (attachment of attachments) {
                    attachment_id = attachment['id']

                    download = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${file['id']}/attachments/${attachment_id}/download`, { headers: headers })
                    blob = await download.blob()

                    file_name = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${file['id']}/attachments/${attachment_id}`, { headers: headers })
                    file_name = await file_name.json()
                    file_name = file_name['fileName']

                    if (file_name == "undefined") {
                        file_name = attachment['fileName']
                    }

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
            }
            else if (file['contentHandler'] == "resource/x-bb-folder") {
                console.log("folder", file)
                await recursiveFetch(headers, file, course_id)
            }

            document.querySelector("#status").innerHTML += `<p class='log'>Downloaded ${file_name}</p>`
            adjustBoxHeight(document.querySelector("p.log"))
        }

        // fade out rest of stuff
        setTimeout(() => {
            const paragraphs = document.querySelectorAll(".log");

            paragraphs.forEach((p, index) => {
                setTimeout(() => {
                    p.classList.add("fade-out-swipe");

                    setTimeout(() => {
                        p.style.display = "none";
                    }, 450);
                }, index * 350);
            });
        }, 1600);
    }

    chrome.cookies.getAll({ domain }, async (cookies) => {
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
        course_id = tab.url.split("/")[5]

        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        }

        init_results = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/`, { headers: headers })
        init_results = await init_results.json()
        init_results = init_results['results']

        console.log(init_results)


        // GET COURSE DOCUMENT STUFF
        for (result of init_results) {
            if (result['title'] == "Course Documents") {
                documents_id = result['id']
                break
            }
        }

        try {
            results = await fetch(`https://www.courses.miami.edu/learn/api/v1/courses/${course_id}/contents/${documents_id}/children`)
            results = await results.json()
            results = results['results']
        }
        catch { results = [] }

        for (result of results) {
            if (result['contentHandler'] == "resource/x-bb-folder") {
                await recursiveFetch(headers, result, course_id);
                continue
            }
            else if (result['contentHandler'] == "resource/x-bb-file") {
                file_name = result['contentDetail']['resource/x-bb-file']['file']['fileName']

                try {
                    download = await fetch(encodeURI("https://www.courses.miami.edu" + result['contentDetail']['resource/x-bb-file']['file']['permanentUrl'], { headers: headers }))
                    blob = await download.blob()

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
                catch (error) {
                    console.error(error)
                }
            }
            else if (result['contentHandler'] == "resource/x-bb-document") {
                attachments = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments`, { headers: headers })
                attachments = await attachments.json()
                attachments = attachments['results']

                for (attachment of attachments) {
                    attachment_id = attachment['id']

                    download = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments/${attachment_id}/download`, { headers: headers })
                    blob = await download.blob()

                    file_name = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments/${attachment_id}`, { headers: headers })
                    file_name = await file_name.json()
                    file_name = file_name['fileName']

                    if (file_name == "undefined") {
                        file_name = attachment['fileName']
                    }

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
            }

            document.querySelector("#status").innerHTML += `<p class='log'>Downloaded ${file_name}</p>`
            adjustBoxHeight(document.querySelector("p.log"))
        }


        // GET ASSIGNMENT DOCUMENT STUFF
        for (result of init_results) {
            if (result['title'] == "Assignments") {
                assignments_id = result['id']
                break
            }
        }

        try {
            results = await fetch(`https://www.courses.miami.edu/learn/api/v1/courses/${course_id}/contents/${assignments_id}/children`)
            results = await results.json()
            results = results['results']
        }
        catch { results = [] }

        console.log("ASSIGNMENTS RESULTS:")
        console.log(results)

        for (result of results) {
            if (result['contentHandler'] == "resource/x-bb-folder") {
                console.log(result['title'] == "Homework", "HOMEWORK FOLDER")
                await recursiveFetch(headers, result, course_id);
                continue
            }
            else if (result['contentHandler'] == "resource/x-bb-file") {
                file_name = result['contentDetail']['resource/x-bb-file']['file']['fileName']

                try {
                    download = await fetch(encodeURI("https://www.courses.miami.edu" + result['contentDetail']['resource/x-bb-file']['file']['permanentUrl'], { headers: headers }))
                    blob = await download.blob()

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
                catch (error) {
                    console.error(error)
                }
            }
            else if (result['contentHandler'] == "resource/x-bb-document" || result['contentHandler'] == "resource/x-bb-assignment") {
                attachments = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments`, { headers: headers })
                attachments = await attachments.json()
                attachments = attachments['results']

                if (attachments.length == 0) {
                    continue
                }

                for (attachment of attachments) {
                    attachment_id = attachment['id']

                    download = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments/${attachment_id}/download`, { headers: headers })
                    blob = await download.blob()

                    file_name = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/contents/${result['id']}/attachments/${attachment_id}`, { headers: headers })
                    file_name = await file_name.json()
                    file_name = file_name['fileName']

                    if (file_name == "undefined") {
                        file_name = attachment['fileName']
                    }

                    const downloadUrl = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = downloadUrl;
                    a.download = file_name;
                    a.click();
                    URL.revokeObjectURL(downloadUrl);
                }
            }

            document.querySelector("#status").innerHTML += `<p class='log'>Downloaded ${file_name}</p>`
            adjustBoxHeight(document.querySelector("p.log"))
        }

        // fade out rest of stuff
        setTimeout(() => {
            const paragraphs = document.querySelectorAll(".log");

            paragraphs.forEach((p, index) => {
                setTimeout(() => {
                    p.classList.add("fade-out-swipe");

                    setTimeout(() => {
                        p.style.display = "none";
                    }, 450);
                }, index * 350);
            });
        }, 1600);

    })

    // chrome.scripting.executeScript(
    //     {
    //         target: { tabId: tab.id },
    //         func: getLinks
    //     },
    //     async (results) => {
    //         const fileLinks = results[0].result

    //         if (fileLinks.length === 0) {
    //             document.querySelector("#status").innerHTML = "<p class='log'>No files found!</p>"

    //             setTimeout(() => {
    //                 setTimeout(() => {
    //                     document.querySelector(".log").classList.add("fade-out-swipe");

    //                     setTimeout(() => {
    //                         document.querySelector(".log").style.display = "none";
    //                     }, 450);
    //                 }, 350);
    //             }, 1600);

    //             return
    //         }

    //         fileLinks.forEach(url => {
    //             chrome.downloads.download({ url })
    //         })

    //         document.querySelector("#status").innerHTML = "<p class='log'>Downloaded all files!</p>"

    //         setTimeout(() => {
    //             setTimeout(() => {
    //                 document.querySelector(".log").classList.add("fade-out-swipe");

    //                 setTimeout(() => {
    //                     document.querySelector(".log").style.display = "none";
    //                 }, 450);
    //             }, 350);
    //         }, 1600);
    //     }
    // )
})

// function for downloading all submissions
document.querySelector("#submission-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    if (document.querySelector("#current-course").innerText == "NONE") {
        p = document.createElement("p")
        p.classList.add("log")
        p.innerText = "Please navigate to a course page to download files!"
        document.querySelector(".output-box").appendChild(p)
        adjustBoxHeight(document.querySelector("p.log"))

        // make all articles flash
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: function () {
                    const intervals = [];

                    function startFlashing(element) {
                        let isFlashing = false;
                        let borderInterval;

                        borderInterval = setInterval(() => {
                            if (isFlashing) {
                                element.style.border = '1px solid #cdcdcd';
                            } else {
                                element.style.border = '1px solid rgb(255 0 0)';
                            }
                            isFlashing = !isFlashing;
                        }, 300);

                        intervals.push(borderInterval);
                    }

                    function stopFlashing() {
                        intervals.forEach(interval => {
                            clearInterval(interval);
                        });

                        const boxes = document.querySelectorAll('article');
                        boxes.forEach(box => {
                            box.style.border = '1px solid #cdcdcd';
                        });
                    }

                    document.querySelectorAll("article").forEach(article => {
                        console.log("START FLASH", article)
                        startFlashing(article);
                    })

                    setTimeout(() => {
                        stopFlashing();
                    }, 2000);
                }
            },
            (results) => { }
        );

        setTimeout(() => {
            document.querySelector(".output-box").innerHTML = ""
            flattenBox()
        }, 1600);
        return;
    }

    chrome.cookies.getAll({ domain }, async (cookies) => {
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
        course_id = tab.url.split("/")[5]

        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        }

        gradebook = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/gradebook/columns`, { headers: headers })
        gradebook = await gradebook.json()
        gradebook = gradebook['results']

        for (column of gradebook) {
            if (column['name'] != "Weighted Total" && column['name'] != "Total") {
                saved_file_name = column['name']
                document.querySelector("#status").innerHTML += `<p class='log'>Downloading ${saved_file_name}...</p>`
                adjustBoxHeight(document.querySelector("p.log"))

                attempts = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/gradebook/columns/${column['id']}/attempts`, { headers: headers })
                attempts = await attempts.json()
                attempts = attempts['results']

                if (attempts.length == 0) {
                    continue
                }

                attempt_id = attempts[0]['id']

                file = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/gradebook/attempts/${attempt_id}/files`, { headers: headers })
                file = await file.json()
                file = file['results']

                if (file.length != 0) {
                    file = file[0]
                    file_id = file['id']
                    file_name = file['name']
                    file_extension = file_name.split(".").at(-1)

                    try {
                        console.log("Downloading: ", `https://www.courses.miami.edu/webapps/assignment/download?course_id=${course_id}&attempt_id=${attempt_id}&file_id=${file_id}&fileName=${file_name}`)
                        download = await fetch(encodeURI(`https://www.courses.miami.edu/webapps/assignment/download?course_id=${course_id}&attempt_id=${attempt_id}&file_id=${file_id}&fileName=${file_name}`, { headers: headers }))
                        blob = await download.blob()

                        const downloadUrl = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = downloadUrl;
                        a.download = `${saved_file_name}.${file_extension}`;
                        a.click();
                        URL.revokeObjectURL(downloadUrl);
                    }
                    catch (error) {
                        console.error(error)
                    }
                }
            }
        }

        // fade out rest of stuff
        setTimeout(() => {
            const paragraphs = document.querySelectorAll(".log");

            paragraphs.forEach((p, index) => {
                setTimeout(() => {
                    p.classList.add("fade-out-swipe");

                    setTimeout(() => {
                        p.style.display = "none";
                    }, 450);
                }, index * 350);
            });
        }, 1600);

    });
})

// placeholder
// document.querySelector("#cookie-btn").addEventListener("click", async () => {
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     const url = new URL(tab.url);
//     const domain = url.hostname;

//     chrome.cookies.getAll({ domain }, async (cookies) => {
//         const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");

//         headers = {
//             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
//             'Cookie': cookieString,
//             'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
//         }

//         response = await fetch('https://www.courses.miami.edu/learn/api/v1/users/me', {headers: headers})
//         response = await response.json()

//         console.log(response)

//     });
// });



// get all students from class
document.querySelector("#students-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    if (document.querySelector("#current-course").innerText == "NONE") {
        p = document.createElement("p")
        p.classList.add("log")
        p.innerText = "Please navigate to a course page!"
        document.querySelector(".output-box").appendChild(p)
        adjustBoxHeight(document.querySelector("p.log"))

        // make all articles flash
        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: function () {
                    const intervals = [];

                    function startFlashing(element) {
                        let isFlashing = false;
                        let borderInterval;

                        borderInterval = setInterval(() => {
                            if (isFlashing) {
                                element.style.border = '1px solid #cdcdcd';
                            } else {
                                element.style.border = '1px solid rgb(255 0 0)';
                            }
                            isFlashing = !isFlashing;
                        }, 300);

                        intervals.push(borderInterval);
                    }

                    function stopFlashing() {
                        intervals.forEach(interval => {
                            clearInterval(interval);
                        });

                        const boxes = document.querySelectorAll('article');
                        boxes.forEach(box => {
                            box.style.border = '1px solid #cdcdcd';
                        });
                    }

                    document.querySelectorAll("article").forEach(article => {
                        console.log("START FLASH", article)
                        startFlashing(article);
                    })

                    setTimeout(() => {
                        stopFlashing();
                    }, 2000);
                }
            },
            (results) => { }
        );

        setTimeout(() => {
            document.querySelector(".output-box").innerHTML = ""
            flattenBox()
        }, 1600);
        return;
    }

    if (document.querySelector("#students-btn").innerText == "Hide Students From Class") {
        p = document.querySelector("#students")

        setTimeout(() => {
            p.classList.remove("fade-in");
            p.classList.add("fade-out");

            flattenBox()

            setTimeout(() => {
                p.remove();
            }, 500);

        }, 500);

        document.querySelector("#students-btn").innerText = "Get Students From Class"
        return
    }

    chrome.cookies.getAll({ domain }, (cookies) => {
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");
        course_id = tab.url.split("/")[5]

        fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_id}/users?expand=user`, {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                'Cookie': cookieString,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            }
        }).then(response => {
            return response.json();
        })
            .then(data => {
                people = { "instructor": [], "grader": [], "students": [] }
                lst = data.results
                lst.forEach(person => {
                    person_name = person['user']['name']['given'] + " " + person['user']['name']['family'] + "," + person['user']['avatar']['viewUrl']
                    if (person['courseRoleId'] == "Instructor") {
                        people["instructor"].push(person_name)
                    }
                    else if (person['courseRoleId'] == "Grader") {
                        people["grader"].push(person_name)
                    }
                    else {
                        if (person['courseRoleId'] == "TeachingAssistant") {
                            person_name = person['user']['name']['given'] + " " + person['user']['name']['family'] + " (TA)," + person['user']['avatar']['viewUrl']
                            // console.log("TA", person_name)
                            people["students"].push(person_name)
                        }
                        else {
                            people["students"].push(person_name)
                        }
                    }
                })

                people.students.sort()

                message = ""
                // SHOW IMAGES
                if (people.instructor.length > 0) {
                    message += `<h3>Instructor:</h3>${people.instructor.map(element => `<li><a class="student-image" href="${element.split(",")[1]}" target="_blank">${element.split(",")[0]}</a></li>`).join("")}`;
                }
                if (people.grader.length > 0) {
                    message += `<h3>Grader:</h3>${people.grader.map(element => `<li><a class="student-image" href="${element.split(",")[1]}" target="_blank">${element.split(",")[0]}</a></li>`).join("")}`;
                }
                
                if (people.students.length > 0) {
                    message += `<h3>Students (${people.students.length} total):</h3>${people.students.map(element => `<li><a class="student-image" href="${element.split(",")[1]}" target="_blank">${element.split(",")[0]}</a></li>`).join("")}`;
                }

                //~ HIDE IMAGES FOR NOW :P                
                // if (people.instructor.length > 0) {
                //     message += `<h3>Instructor:</h3>${people.instructor.map(element => `<li>${element.split(",")[0]}</li>`).join("")}`;
                // }
                // if (people.grader.length > 0) {
                //     message += `<h3>Grader:</h3>${people.grader.map(element => `<li>${element.split(",")[0]}</li>`).join("")}`;
                // }
                // if (people.students.length > 0) {
                //     message += `<h3>Students:</h3>${people.students.map(element => `<li>${element.split(",")[0]}</li>`).join("")}`;
                // }

                
                p = document.createElement("p")
                p.id = "students"
                message += "<br><br><br><br><br><br><br>"
                p.innerHTML = message
                document.querySelector(".output-box").appendChild(p)
                adjustBoxHeight(p)

                document.querySelectorAll(".student-image").forEach(image => {
                    image.addEventListener("mouseover", (event) => {
                        event.preventDefault()
                        student_image = document.createElement("img")
                        student_image.src = event.target.href
                        student_image.style = "width: 180px; height: 200px;"
                        event.target.parentElement.insertAdjacentElement("afterend", student_image)
                    })
                })
                document.querySelectorAll(".student-image").forEach(image => {
                    image.addEventListener("mouseout", (event) => {
                        event.preventDefault()
                        student_image = document.querySelector("#students img")
                        student_image.remove()
                    })
                })

                setTimeout(() => {
                    p.classList.add("fade-in");
                }, 200);

                document.querySelector("#students-btn").innerText = "Hide Students From Class"

            })
            .catch(error => {
                console.error(error);
            });
    });
});

// function for getting dining dollars
document.querySelector("#dining-btn").addEventListener("click", async () => {
    if (document.querySelector("#dining-btn").innerText == "Hide Dining Dollars") {
        p = document.querySelector("table")

        setTimeout(() => {
            p.classList.remove("fade-in");
            p.classList.add("fade-out");

            flattenBox()

            setTimeout(() => {
                p.remove();
            }, 500);

        }, 500);

        document.querySelector("#dining-btn").innerText = "Show Dining Dollars"
        return
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
            { action: "fetchDining", url: `https://get.cbord.com/miami/full/login.php?2=2` },
            (response) => {
                if (response.success) {
                    resolve(response.response);
                } else {
                    reject(response.error);
                }
            }
        );
    });

    parser = new DOMParser();
    doc = parser.parseFromString(response, 'text/html');

    funds = doc.querySelector("table").innerHTML

    p = document.createElement("table")
    p.classList.add("log")
    p.innerHTML = funds
    document.querySelector(".output-box").appendChild(p)
    adjustBoxHeight(document.querySelector("table.log"))

    document.querySelector("#dining-btn").innerText = "Hide Dining Dollars"
})

// function searching classes
document.querySelector("#class-search-btn").addEventListener("click", async () => {
    if (document.querySelector("#class-search-btn").innerText == "Hide Classes") {
        p = document.querySelector("#classBox")

        if (p != null) {
            p = document.querySelector("#classBox")
    
            flattenBox()
    
            setTimeout(() => {
                p.remove();
            }, 500);
    
            document.querySelector("#class-search-btn").innerText = "Class Search"
            return
        }
        else {
            p = document.querySelector("#class-search-input")

            flattenBox()
    
            setTimeout(() => {
                document.querySelector("#search-btn").remove()
                p.remove();
            }, 500);

    
            document.querySelector("#class-search-btn").innerText = "Class Search"
            return
        }

    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    response = await new Promise((resolve, reject) => {
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0];

        chrome.runtime.sendMessage(
            { action: "fetchSchedule", url: `https://canelink.miami.edu/psc/UMIACP1D/EMPLOYEE/SA/s/WEBLIB_HCX_EN.H_SCHEDULE.FieldFormula.IScript_ScheduleByInterval?from=${formattedDate}&thru=${formattedDate}`, postUrl: "https://canelink.miami.edu:443/Shibboleth.sso/SAML2/POST", type: 'json' },
            (response) => {
                if (response.success) {
                    resolve(response.response);
                } else {
                    reject(response.error);
                }
            }
        );
    });

    current_term = response['term']
    current_term = "2258"

    questionBox = document.createElement("div")
    questionBox.id = "questionBox"
    inputBox = document.createElement("input")
    inputBox.id = "class-search-input"
    inputBox.placeholder = "(MTH210)"
    inputBox.type = "text"
    inputBox.autocomplete = "off"
    inputBox.spellcheck = "false"
    inputBox.autocorrect = "off"
    inputBox.autocapitalize = "off"
    inputBox.maxLength = 6

    searchBtn = document.createElement("button")
    searchBtn.id = "search-btn"
    searchBtn.innerText = "Search"

    questionBox.appendChild(inputBox)
    questionBox.appendChild(searchBtn)
    document.querySelector(".output-box").appendChild(questionBox)
    adjustBoxHeight(questionBox)

    document.querySelector("#class-search-btn").innerText = "Hide Classes"

    document.querySelector("#search-btn").addEventListener("click", async () => {
        classSubject = document.querySelector("#questionBox input").value.substring(0, 3).toUpperCase()
        classCode = document.querySelector("#questionBox input").value.substring(3, 6)
        document.querySelector("#questionBox").remove()

        classes = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { action: "fetchSchedule", url: `https://canelink.miami.edu/psc/UMIACP1D/EMPLOYEE/SA/s/WEBLIB_HCX_CM.H_CLASS_SEARCH.FieldFormula.IScript_ClassSearch?institution=MIAMI&term=${current_term}&date_from=&date_thru=&subject=${classSubject}&subject_like=&catalog_nbr=${classCode}&start_time_equals=&start_time_ge=&end_time_equals=&end_time_le=&days=&campus=&location=&x_acad_career=UGRD&acad_group=&rqmnt_designtn=&instruction_mode=&keyword=&class_nbr=&acad_org=&enrl_stat=&crse_attr=&crse_attr_value=&instructor_name=&instr_first_name=&session_code=&units=&trigger_search=&page=1`, postUrl: "https://canelink.miami.edu:443/Shibboleth.sso/SAML2/POST", type: 'json' },
                (response) => {
                    if (response.success) {
                        resolve(response.response);
                    } else {
                        reject(response.error);
                    }
                }
            );
        });

        if (classes.length == 0) {
            p = document.createElement("p")
            p.classList.add("log")
            p.innerText = "No classes found!"
            document.querySelector(".output-box").appendChild(p)
            adjustBoxHeight(document.querySelector("p.log"))
            setTimeout(() => {
                p.remove()
                flattenBox()
            }, 1500);
            return
        }

        classBox = document.createElement("div")
        classBox.id = "classBox"
        classBox.innerHTML = `<h3>Showing classes for ${classes[0]['acad_org'] + classes[0]['catalog_nbr']} | ${classes[0]['descr']}:</h3>`

        for (course of classes) {
            let courseBox = document.createElement("div")
            courseBox.classList.add("course-box")

            startTime = convertToNormalTime(course['meetings'][0]['start_time'])
            endTime = convertToNormalTime(course['meetings'][0]['end_time'])

            instructor = course['instructors'][0]['name']

            rating = await fetch("https://www.ratemyprofessors.com/graphql", {
                "headers": {
                    "authorization": "Basic dGVzdDp0ZXN0",
                    "content-type": "application/json",
                },
                body: JSON.stringify({
                    'query': 'query TeacherSearchResultsPageQuery(\n  $query: TeacherSearchQuery!\n  $schoolID: ID\n  $includeSchoolFilter: Boolean!\n) {\n  search: newSearch {\n    ...TeacherSearchPagination_search_1ZLmLD\n  }\n  school: node(id: $schoolID) @include(if: $includeSchoolFilter) {\n    __typename\n    ... on School {\n      name\n    }\n    id\n  }\n}\n\nfragment TeacherSearchPagination_search_1ZLmLD on newSearch {\n  teachers(query: $query, first: 1, after: "") {\n    didFallback\n    edges {\n      cursor\n      node {\n        ...TeacherCard_teacher\n        id\n        __typename\n      }\n    }\n    pageInfo {\n      hasNextPage\n      endCursor\n    }\n    resultCount\n    filters {\n      field\n      options {\n        value\n        id\n      }\n    }\n  }\n}\n\nfragment TeacherCard_teacher on Teacher {\n  id\n  legacyId\n  avgRating\n  numRatings\n  ...CardFeedback_teacher\n  ...CardSchool_teacher\n  ...CardName_teacher\n  ...TeacherBookmark_teacher\n}\n\nfragment CardFeedback_teacher on Teacher {\n  wouldTakeAgainPercent\n  avgDifficulty\n}\n\nfragment CardSchool_teacher on Teacher {\n  department\n  school {\n    name\n    id\n  }\n}\n\nfragment CardName_teacher on Teacher {\n  firstName\n  lastName\n}\n\nfragment TeacherBookmark_teacher on Teacher {\n  id\n  isSaved\n}\n',
                    'variables': {
                        'query': {
                            'text': instructor,
                            'schoolID': 'U2Nob29sLTEyNDE=',
                            'fallback': true
                        },
                        'schoolID': 'U2Nob29sLTEyNDE=',
                        'includeSchoolFilter': true
                    }
                }),
                "method": "POST",
            });
            rating = await rating.json()
            rating = await rating['data']['search']['teachers']['edges'][0]['node']

            courseBox.innerHTML = `
                <h3>${course['subject']} ${course['catalog_nbr']} (${course['component']})</h3>
                <h4>Instructor: ${instructor} <a target="_blank" href="https://www.ratemyprofessors.com/professor/${rating['legacyId']}">(${rating['avgRating']}/5.0)</a></h4>
                <p><strong>${course['meetings'][0]['days']}</strong> ${startTime} - ${endTime}
                <p><strong>Location:</strong> ${course['meetings'][0]['facility_descr']}</p>
            `
            classBox.appendChild(courseBox)
        }

        document.querySelector(".output-box").appendChild(classBox)

        adjustBoxHeight(classBox)

        document.querySelector("#class-search-btn").innerText = "Hide Classes"
    })

})

// function for showing overlapping students
document.querySelector("#overlap-btn").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const url = new URL(tab.url);
    const domain = url.hostname;

    if (document.querySelector("#overlap-btn").innerText == "Hide Overlap Students") {
        p = document.querySelector("#overlap-box")

        setTimeout(() => {
            p.classList.remove("fade-in");
            p.classList.add("fade-out");

            flattenBox()

            setTimeout(() => {
                p.remove();
            }, 500);

        }, 500);

        document.querySelector("#overlap-btn").innerText = "Show Overlap Students"
        return
    }

    chrome.cookies.getAll({ domain }, async (cookies) => {
        const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join("; ");

        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Cookie': cookieString,
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        }

        response = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/users/me`, { headers: headers })
        response = await response.json()

        user_name = response['name']['given'] + " " + response['name']['family']

        response = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/users/me/courses?expand=course`, { headers: headers })
        response = await response.json()
        courses = response['results']

        all_terms = {}

        for (course of courses) {
            term = course['course']['name'].split("(")[1].split(")")[0]
            if (!all_terms[term]) {
                all_terms[term] = course['course']['name'].split(" - ")[0]
            }
        }

        console.log("All terms:", all_terms)
        
        buttonBox = document.createElement("div")
        buttonBox.id = "button-box"
        buttonBox.innerHTML = `<h3>Choose a term:</h3>`

        Object.entries(all_terms).forEach(([termName, term]) => {
            button = document.createElement("button")
            button.innerText = termName
            button.id = term
            button.addEventListener("click", async () => {
                course_ids = courses
                .filter(course => course['course']['name'].includes(term))
                .map(course => course['course']['id'] + "," + course['course']['courseId'].substring(0, 6));
    
                students = {}
                overlaps = ""
        
                await Promise.all(course_ids.map(async course_id => {
                    const [course_api_id, course_name] = course_id.split(",");
                    const res = await fetch(`https://www.courses.miami.edu/learn/api/public/v1/courses/${course_api_id}/users?expand=user`, { headers });
        
                    if (res.status !== 403) {
                        const data = await res.json();
                        const results = data['results'];
        
                        results.forEach(person => {
                            const person_name = person['user']['name']['given'] + " " + person['user']['name']['family'];
                            if (person['courseRoleId'] === "Student" && person_name !== user_name && !person_name.includes("Preview")) {
                                if (!students[person_name]) {
                                    students[person_name] = { count: 0, courses: [] };
                                }
                                students[person_name].count += 1;
                                students[person_name].courses.push(course_name);
                            }
                        });
                    }
                }));
        
                overlapBox = document.createElement("div")
                overlapBox.id = "overlap-box"
                overlapBox.innerHTML = `<h3>Overlapping Students (${termName}):</h3>`
        
                overlaps = Object.entries(students)
                    .filter(([_, details]) => details.count > 1)
                    .sort(([, a], [, b]) => b.count - a.count) // Sort by count in descending order
                    .map(([student, details]) =>
                        `<li>${student} (${details.count} classes): ${details.courses.join(", ")}</li>`
                    );
        
                console.log(students);
                console.log(overlaps)
        
                overlapBox.innerHTML += `<ul>${overlaps.join("<br>")}</ul>`
        
                document.querySelector(".output-box").appendChild(overlapBox)
                adjustBoxHeight(overlapBox)
            })
            buttonBox.appendChild(button)
        })

        document.querySelector(".output-box").appendChild(buttonBox)

        adjustBoxHeight(buttonBox)

        document.querySelector("#overlap-btn").innerText = "Hide Overlap Students"

    })
})

// function for showing all ongoing classes
document.querySelector("#ongoing-btn").addEventListener("click", async () => {
    if (document.querySelector("#ongoing-btn").innerText == "Hide Ongoing Classes") {
        p = document.querySelector("#ongoing-box")

        setTimeout(() => {
            p.classList.remove("fade-in");
            p.classList.add("fade-out");

            flattenBox()

            setTimeout(() => {
                p.remove();
            }, 500);

        }, 500);

        document.querySelector("#ongoing-btn").innerText = "Show Ongoing Classes"
        return
    }

    fetch(chrome.runtime.getURL("data/classes_spring2026.json"))
    .then(response => response.json())
    .then(data => {
    let checkTime = new Date();
    checkTime.setMinutes(checkTime.getMinutes());

    const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const currentDay = daysOfWeek[new Date().getDay()];

    outputString = ""

    for (const key in data) {
        const value = data[key];

        value.classes.forEach(course => {
            let meetingTime = course.meeting_times;

            if (!meetingTime || meetingTime.includes("TBA")) {
                return; // Skip TBA classes
            }

            try {
                let [days, timeRange] = meetingTime.split(", ");
                let [start, end] = timeRange.split(" - ");

                let [startHours, startMinutes] = start.split(".");
                let [endHours, endMinutes] = end.split(".");

                let startTime = new Date();
                startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0);

                let endTime = new Date();
                endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0);

                // Check if current time is within the class duration
                if (startTime <= checkTime && checkTime <= endTime && days.includes(currentDay)) {
                    outputString += `<ul>${course.class_code} (${course.class_name} [${course.class_type.slice(0, 3)}]) - <strong>${course.room_number}</strong> | ${course.professor} | (${days} ${startHours}:${startMinutes} - ${endHours}:${endMinutes})<p style="display: none;">${course.subject_description}</p></ul>`
                }
            } catch (error) {
                console.warn("Error parsing time:", error);
            }
        });
    }

    outputBox = document.createElement("div")

    filterInput = document.createElement("input")
    filterInput.id = "filter-input"
    filterInput.placeholder = "Filter classes"
    filterInput.style.width = "160px"
    filterInput.style.margin = "0 10px 10px 0"
    outputBox.appendChild(filterInput)

    filterButton = document.createElement("button")
    filterButton.id = "filter-button"
    filterButton.innerText = "Filter"
    outputBox.appendChild(filterButton)

    resetButton = document.createElement("button")
    resetButton.id = "reset-button"
    resetButton.innerText = "Reset"
    resetButton.style.margin = "0 15px"
    outputBox.appendChild(resetButton)
    
    outputBox.id = "ongoing-box"
    outputBox.innerHTML += `<h3>Currently Ongoing Classes:</h3>${outputString}`

    document.querySelector(".output-box").appendChild(outputBox)
    adjustBoxHeight(outputBox)

    document.querySelector("#ongoing-btn").innerText = "Hide Ongoing Classes"

    document.querySelector("#filter-button").addEventListener("click", () => {
        const filterText = document.querySelector("#filter-input").value;
        const classes = document.querySelectorAll("#ongoing-box ul");

        classes.forEach(course => {
            if (course.innerHTML.toLowerCase().includes(filterText.toLowerCase())) {
                course.innerHTML = course.innerHTML.replace(filterText, `<span style="background-color: #ff9090;">${filterText}</span>`);
                course.style.display = "block";
            } else {
                course.style.display = "none";
            }
        });
    });

    document.querySelector("#reset-button").addEventListener("click", () => {
        const classes = document.querySelectorAll("#ongoing-box ul");

        classes.forEach(course => {
            course.innerHTML = course.innerHTML.replace(/<span style="background-color: #ff9090;">|<\/span>/g, "");
            course.style.display = "block";
        });
    })

    })
    .catch(error => console.error("Error loading JSON:", error));
})

// gets all link that have bbcswebdav in them
function getLinks() {
    files = []

    iframes = Array.from(document.querySelectorAll('iframe'))

    iframes.forEach(iframe => {
        if (iframe.contentDocument) {
            links = Array.from(iframe.contentDocument.querySelectorAll('a[href]'))
            links.forEach(link => {
                href = link.href
                if (href.includes("bbcswebdav")) {
                    files.push(href)
                }
            })
        }
    })

    return files
}

function convertToNormalTime(inputTime) {
    const correctedTime = inputTime.replace(/\./g, ':');

    const [timePart, offset] = correctedTime.split('-');
    [hours, minutes] = timePart.split(':').map(Number);

    hours = hours - 2;

    const date = new Date();
    date.setUTCHours(hours - parseInt(offset), minutes, 0, 0);

    let hour = date.getHours();
    const isPM = hour >= 12;
    hour = hour % 12 || 12;
    const formattedTime = `${hour}:${String(date.getMinutes()).padStart(2, '0')} ${isPM ? 'AM' : 'PM'}`;

    return formattedTime;
}

// just for css transitions
function adjustBoxHeight(tag) {
    if (isNaN(parseFloat(document.querySelector(".output-box").style.maxHeight))) {
        height = tag.scrollHeight + 200;
        document.querySelector(".output-box").style.maxHeight = `${height}px`;
    }
    else {
        height = parseFloat(document.querySelector(".output-box").style.maxHeight) + tag.scrollHeight + 200;
        document.querySelector(".output-box").style.maxHeight = `${height}px`;
    }
}

function flattenBox() {
    document.querySelector(".output-box").style.maxHeight = "10px";
    setTimeout(() => {
        document.querySelector(".output-box").style = "";
    }, 1000);
}


