function TasksAI() {
  const listName = 'My AI Helper';
  var list;
  var listMain;


  const gtasks = Tasks.Tasklists.list();
  for (let x of gtasks.items) {
    if (x.title === listName) {
      list = x;
    }
    if (x.title === 'Main') {
      listMain = x;
    }
  }

  if (!list) {
    list = Tasks.Tasklists.insert({
    "title": listName  // Title of the task list
    })
  }

  if (!listMain) {
    listMain = Tasks.Tasklists.insert({
    "title": 'Main'  // Title of the task list
    })
  }

  Logger.log(list)

  const tasks = Tasks.Tasks.list(list.id)
    for (let x of tasks.items) {
      var geminiOutput = callGemini(taskPrompt + x.title)
      Logger.log(geminiOutput)
      geminiOutput = JSON.parse(geminiOutput.replace(/```(?:json|)/g, "")); 
      x.notes = geminiOutput.total_estimated_time + " " +  geminiOutput.completion_summary
      var tasks1 = geminiOutput.steps.map(function(aiItem) {
        return Tasks.Tasks.insert({
          "title": aiItem.step_description,
          "notes": [
            "Ensure that your bank card and identification card are easily accessible.",
            "time => "+ aiItem.estimated_time,
            "needed => "+ aiItem.resources_needed
          ].join('\n'),
        }, list.id);
      })

      Tasks.Tasks.update(x, list.id, x.id)
      moveTaskToSubtask(list.id, x.id, {parentTaskId: null, parentListId: listMain.id})
      tasks1.forEach(function(sub) {
        moveTaskToSubtask(list.id, sub.id, {parentTaskId: x.id, parentListId:listMain.id})
      })
    }
    Logger.log('Done');
}

function addQueryParam(url, paramName, param) {
  if (url.includes('?')) return url + `&${paramName}=${param}`;
  return url + `?${paramName}=${param}`;
}

function moveTaskToSubtask(taskListId, taskId, {parentTaskId, parentListId}) {
  var token = ScriptApp.getOAuthToken();

  var url = `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}/move`;
  url = parentTaskId ? addQueryParam(url, 'parent', parentTaskId): url;
  url = parentListId ? addQueryParam(url, 'destinationTasklist', parentListId): url;

Logger.log(url)
  var options = {
    method: 'post',
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response);
  return data;
}


function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('My HTML Page')
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}