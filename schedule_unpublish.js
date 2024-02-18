var XMLHttpRequest = require('xhr2'); // so the xhr works also with node, without this it would work in browser only
const http = require('http');
const port = 3000;

var project_id = ''; 
var item_codename = ''; 
var language = ''; 


const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN; // MAPI Key in .env file

function scheduleUnpublish(timezone, date, item_codename) {
  console.log(`----Scheduling unpublish for----`)
  console.log(timezone, date, item_codename, language)

  var apiUrl = `https://manage.kontent.ai/v2/projects/${project_id}/items/codename/${item_codename}/variants/codename/${language}/unpublish-and-archive`; // Replace this with your API URL


    const requestBody = {
        "scheduled_to": date,
        "display_timezone": timezone
      };        

  

    fetch(`${apiUrl}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_BEARER_TOKEN}`
      },
      body: JSON.stringify(requestBody)
    })
    .then(response => {
      if (response.ok) {
        // Check if the response is not an empty string
        if (response.status === 204) {
          // Status code 204 (No Content) indicates success with no content returned
          console.log('Success: No content returned');
          return;
        }
        return response.json(); // Parse the JSON in the response
      }
      throw new Error('Network response was not ok.');
    })
    .then(data => {
      if (data) {
        console.log('Success:', data); // Handle the parsed JSON data
      }
    })
    .catch(error => {
      console.error('Error:', error); // Handle any errors from the request
    });
}


//finding out out the unpublish date value
function fetchUnpublishDate(project_id, item_codename) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
      if (xhr.readyState === XMLHttpRequest.DONE) {
          if (xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              console.log(JSON.stringify(response)); //so the values of the elements are not displayed [Object] only in the response
              
              // sem pridam variables ktore zistim       
              var date = response.item.elements.unpublish.value;
              console.log(`date is ${date}`);

              var timezone = response.item.elements.unpublish.display_timezone;
              console.log(`timezone is ${timezone}`);

              scheduleUnpublish(timezone, date, item_codename);
          } else {
              console.error('There was a problem with the request.');
          }
      }
  };
  xhr.open('GET', 'https://deliver.kontent.ai/' + project_id + '/items/' + item_codename, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-KC-Wait-For-Loading-New-Content','true'); //important, otherwise it can use old content and is buggy
  xhr.send();
}

//webhook stuff
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      // Parse the JSON data
      let jsonData;
      try {
        jsonData = JSON.parse(body);
      } catch (error) {
        console.error('Error parsing JSON:', error.message);
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request - Invalid JSON');
        return;
      }

      // Work with the parsed JSON data
      if (jsonData && jsonData.data) {
        const notification = jsonData;
        console.log('Received notification:', JSON.stringify(notification));
        console.log('---')
        if (notification.data.items[0].type == 'test_unpublish_date') {

          //find out item codename and projectID for the Delivery API call
          item_codename = notification.data.items[0].codename;
          console.log(`item_codename is ${item_codename}`);
          project_id = notification.message.project_id;
          console.log(`project ID is ${project_id}`);
          language = notification.data.items[0].language;
          console.log(`language is ${language}`);

          
          fetchUnpublishDate(project_id, item_codename);

        } else {
          console.log("Item is not supposed to be unpublished")
        }

        // Respond with a 200 status code
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Webhook received successfully!');
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Bad Request - Invalid JSON structure');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});