function startIntro(){
    var intro = introJs();
      intro.setOptions({
        steps: [
          {
            element: '#main_panel',
            intro: "This is a <b>bold</b> tooltip."
          },
          {
            element: '#tip_panel',
            intro: "Ok, <i>wasn't</i> that fun?",
            position: 'right'
          },
          {
            element: '#activity_panel',
            intro: 'More features, more <span style="color: red;">f</span><span style="color: green;">u</span><span style="color: blue;">n</span>.',
            position: 'left'
          }
        ]
      });
      intro.start();
  }