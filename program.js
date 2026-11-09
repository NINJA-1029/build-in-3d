(() => {
  const dialog = document.getElementById('pf-program-detail');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const notes = {
    competition: {
      summary: 'Take an engineering problem from a brief to a working build. In RoboReach, for example, a mobile robot must lift and place objects while navigating a course.',
      practical: 'Choose a challenge to find its rulebook, team size, qualifying rounds and registration deadline.',
      action: 'Browse competitions'
    },
    exhibition: {
      summary: 'Explore the festival floor and get a closer look at the machines and research on display. Past exhibitions have featured automotive engineering and emerging technologies.',
      practical: 'Check the official exhibitions page when planning your visit for the latest showcase information.',
      action: 'Explore exhibitions'
    },
    lecture: {
      summary: 'Hear from people working at the edge of their fields. Past Techfest speakers include astronaut Rakesh Sharma and Nobel Prize–winning physicist Serge Haroche.',
      practical: 'Explore the speaker archive and check the official programme for this edition’s sessions.',
      action: 'Explore lectures'
    }
  };

  const heading = dialog.querySelector('#pf-detail-title');
  const summary = dialog.querySelector('#pf-detail-summary');
  const practical = dialog.querySelector('#pf-detail-practical');
  const image = dialog.querySelector('#pf-detail-image');
  const destination = dialog.querySelector('#pf-detail-link');
  const close = dialog.querySelector('.pf-close');
  let opener;

  document.querySelectorAll('[data-pf-key]').forEach((link) => {
    const item = notes[link.dataset.pfKey];
    if (!item) return;
    link.setAttribute('aria-haspopup', 'dialog');
    link.setAttribute('aria-controls', dialog.id);
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      heading.textContent = link.querySelector('h3').textContent;
      image.src = link.querySelector('img').src;
      summary.textContent = item.summary;
      practical.textContent = item.practical;
      destination.href = link.href;
      destination.firstChild.nodeValue = item.action + ' ';
      dialog.showModal();
    });
  });

  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
      dialog.close();
    }
  });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
})();
