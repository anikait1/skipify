document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === 'a') {
    console.log('start');
  } else if (event.ctrlKey && event.key === 'd') {
    console.log('end')
  }

  event.preventDefault();
})