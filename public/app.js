$(document).on("click", ".commentId", function() {
  // Make sure to preventDefault on a submit event.
  console.log("button clicked");
 
  $(".comments").empty();
  var thisId = $(this).attr("data-id");
  console.log("thisId", thisId);
  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  }).then(function(data) {
    console.log("data", data);
    // Reload the page to get the updated list
 
    $(".comments").append("<h2> Leave a Comment <h2>");
    $(".comments").append("<textarea id='com' name'comment'></textarea><br>");
    $(".comments").append(
      "<button data-id='" + data._id + "'id='saveBtn'>Save Comment</button>"
    );

    if (data.comment) {
      $("#com").val(data.comment.body);
    }
  });
});

// Clicking to save comment
$(document).on("click", "#saveBtn", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");

  // Run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      body: $("#com").val()
    }

  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the comments section
      $(".comments").empty();
    });

  $("#com").val("");
});