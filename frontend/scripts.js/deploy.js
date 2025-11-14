const ghpages = require('gh-pages');

ghpages.publish(
  'build',
  {
    dotfiles: true,
    message: 'Deploy via script',
  },
  function (err) {
    if (err) {
      console.error('Deployment error:', err);
    } else {
      console.log('Deployment successful!');
    }
  }
);