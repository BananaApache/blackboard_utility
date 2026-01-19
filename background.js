

function extractInputs(htmlString) {
  const inputRegex = /<input\s+([^>]*?)>/gi;
  const inputDict = {};
  
  let match;
  while ((match = inputRegex.exec(htmlString)) !== null) {
    const inputAttributes = {};
    
    const attributeRegex = /(\w+)(?:=["']([^"']*?)["'])?/gi;
    let attributeMatch;
    while ((attributeMatch = attributeRegex.exec(match[1])) !== null) {
      inputAttributes[attributeMatch[1]] = attributeMatch[2] || true;
    }
    
    const inputName = inputAttributes.name || `unnamed_input_${Object.keys(inputDict).length}`;
    inputDict[inputName] = inputAttributes;
  }
  
  return inputDict;
}

function extractFormTokenValues(html) {
  const tokens = [];
  const regex = /<input[^>]*id="formToken"[^>]*value="([^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
      tokens.push(match[1]);
  }
  return tokens;
}

function extractOptionValues(html) {
  const options = [];
  const regex = /<option[^>]*value="([^"]*)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
      options.push(match[1]);
  }
  return options;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchSchedule") {
    fetchData = async () => {
      try {
        const cookies = await new Promise((resolve, reject) => {
          chrome.cookies.getAll({ url: message.url }, (cookies) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(cookies);
            }
          });
        });

        const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");

        const headers = {
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Cookie": cookieString,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        };

        const response = await fetch(message.url, { headers: headers });

        console.log(response.url)

        if (response.url.includes("auth.miami")) {

          html = await response.text()
          
          inputs = extractInputs(html)

          let SAMLResponse = inputs['SAMLResponse']['value']
          let RelayState = inputs['RelayState']['value']

          auth = await fetch(message.postUrl,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieString,
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
              },
              body: new URLSearchParams(
                {
                'SAMLResponse': SAMLResponse,
                'RelayState': RelayState
              })              
            }
          )

          if (message.type == "json") {
            data = await auth.json();
            sendResponse({ success: true, response: data });
          }
          else {
            data = await auth.text();
            sendResponse({ success: true, response: data });
          }

        }
        else {
          if (message.type == "json") {
            data = await response.json();
            sendResponse({ success: true, response: data });
          }
          else {
            data = await response.text();
            sendResponse({ success: true, response: data });
          }
        }

      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    };

    fetchData();
    return true;
  }

  if (message.action === "fetchDining") {
      fetchData = async () => {
        try {
          const cookies = await new Promise((resolve, reject) => {
            chrome.cookies.getAll({ url: message.url }, (cookies) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(cookies);
              }
            });
          });
  
          cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  
          const headers = {
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
            "Cookie": cookieString,
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          };
  
          const response = await fetch(message.url, { headers: headers });

          if (response.url.includes("auth.miami")) {

            html = await response.text()
            
            inputs = extractInputs(html)

            let SAMLResponse = inputs['SAMLResponse']['value']
            let RelayState = inputs['RelayState']['value']

            auth = await fetch(`https://get.cbord.com/miami/Shibboleth.sso/SAML2/POST`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
                  'Cookie': cookieString,
                  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                },
                body: new URLSearchParams(
                  {
                  'SAMLResponse': SAMLResponse,
                  'RelayState': RelayState
                })              
              }
            )

            data = await auth.text();

            sendResponse({ success: true, response: data });

          }
          else {
            data = await response.text();
                        
            formToken = extractFormTokenValues(data)[0]
            userId = data.split('getOverview("')[1].split('"')[0]

            funds_response = await fetch('https://get.cbord.com/miami/full/funds_overview_partial.php', 
              {
                method: 'POST',
                headers: headers,
                body: new URLSearchParams(
                  {
                    'userId': userId,
                    'formToken': formToken
                  }
                )
              }
            )
            
            funds = await funds_response.text()

            sendResponse({ success: true, response: funds });
          }

        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      };
  
      fetchData();
      return true;  
  }

  if (message.action === "searchClass") {

  }
});