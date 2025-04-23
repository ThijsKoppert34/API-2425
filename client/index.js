import './index.css';

document.addEventListener('navigate', () => {
  if (!document.startViewTransition) {
    return
  } else {
    document.startViewTransition(() => {
      console.log('View transition started');
    })
  }
})
// transition api

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    document.title = 'De stad wacht op je';
  } else {
    document.title = 'Welkom!';
  }
})
// page visibility api  
