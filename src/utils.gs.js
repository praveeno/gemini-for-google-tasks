const properties = PropertiesService.getScriptProperties().getProperties();
const geminiApiKey = properties['GOOGLE_API_KEY'];

const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro-latest:generateContent?key=${geminiApiKey}`;
const geminiProVisionEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

// ===== SDK

function callGemini(prompt, temperature=0) {
  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": prompt
          },
        ]
      }
    ], 
    "generationConfig":  {
      "temperature": temperature,
    },
  };

  const options = { 
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(geminiEndpoint, options);
  const data = JSON.parse(response);
  const content = data["candidates"][0]["content"]["parts"][0]["text"];
  return content;
}

function callGeminiProVision(prompt, image, temperature=0) {
  const imageData = Utilities.base64Encode(image.getAs('image/png').getBytes());

  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": prompt
          },
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": imageData
            }
          }          
        ]
      }
    ], 
    "generationConfig":  {
      "temperature": temperature,
    },
  };

  const options = { 
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(geminiProVisionEndpoint, options);
  const data = JSON.parse(response);
  const content = data["candidates"][0]["content"]["parts"][0]["text"];
  return content;
}

function callGeminiWithTools(prompt, tools, temperature=0) {
  const payload = {
    "contents": [
      {
        "parts": [
          {
            "text": prompt
          },
        ]
      }
    ], 
    "tools" : tools,
    "generationConfig":  {
      "temperature": temperature,
    },    
  };

  const options = { 
    'method' : 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(geminiEndpoint, options);
  const data = JSON.parse(response);
  const content = data["candidates"][0]["content"]["parts"][0]["functionCall"];
  return content;
}

// ================== Exec
function testGemini() {
  const prompt = "The best thing since sliced bread is";
  const output = callGemini(prompt);
  console.log(prompt, output);
}

function testGeminiVision() {
  const prompt = "Provide a fun fact about this object.";
  const image = UrlFetchApp.fetch('https://storage.googleapis.com/generativeai-downloads/images/instrument.jpg').getBlob();
  const output = callGeminiProVision(prompt, image);
  console.log(prompt, output);
}

const taskPrompt = [
"You are a task planning assistant. The user will input a task, and you need to break it down into detailed steps required to complete", "the task. Provide a description for each step, a list of necessary resources, and any additional information that may help in completing the task.",
"also find good relative link for each step so user can understand more, and one webViewLink, regarding context of task, so user can visualise.",
"Return the response in the JSON format, ensure JSON always should be a valid json, which we can parse using JSON.parse:",
    '{ "task": "<User\'s task>", ',
      '"steps": [ { "step_number": 1, "step_description": "Description of the step", "resources_needed": ["Resource 1", "Resource 2"],',
      '"links": [{ "type": string, "description": string, "link": string }, ...],',
      '"estimated_time": "Time required to complete the step", "additional_notes": "Any other relevant information for the step"}...],',
      '"total_estimated_time": "Total time required to complete the task",',
      '"webViewLink": "",',
      '"completion_summary": "Overall summary of how to complete the task" }',
    'Task:' 
].join('\n')