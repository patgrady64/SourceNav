const projectNameInput = document.getElementById('projectName');
const addProjectButton = document.getElementById('addProject');
const projectList = document.getElementById('projectList');
const currentPageTitle = document.getElementById('currentPageTitle');
const currentPageUrl = document.getElementById('currentPageUrl');
const savePageButton = document.getElementById('savePage');
const saveStatus = document.getElementById('saveStatus');

let projects = [];
let sources = [];
let activeProjectId = null;
let currentTab = null;

loadData();
loadCurrentPage();

addProjectButton.addEventListener('click', addProject);
savePageButton.addEventListener('click', saveCurrentPage);

async function loadData() {
  const data = await chrome.storage.local.get([
    'projects',
    'activeProjectId',
    'sources',
  ]);

  projects = data.projects || [];
  sources = data.sources || [];
  activeProjectId = data.activeProjectId || null;

  if (
    activeProjectId &&
    !projects.some((project) => project.id === activeProjectId)
  ) {
    activeProjectId = null;
  }

  renderProjects();
}

async function addProject() {
  const name = projectNameInput.value.trim();

  if (!name) {
    return;
  }

  const project = {
    id: crypto.randomUUID(),
    name: name,
  };

  projects.push(project);

  await saveProjects();

  projectNameInput.value = '';

  renderProjects();
}

async function deleteProject(id) {
  const project = projects.find((project) => project.id === id);

  if (!project) {
    return;
  }

  const confirmed = confirm(
    `Delete "${project.name}" and all of its saved pages?`,
  );

  if (!confirmed) {
    return;
  }

  projects = projects.filter((project) => project.id !== id);

  sources = sources.filter((source) => source.projectId !== id);

  if (activeProjectId === id) {
    activeProjectId = null;
  }

  await chrome.storage.local.set({
    projects: projects,
    sources: sources,
    activeProjectId: activeProjectId,
  });

  renderProjects();
}

async function saveProjects() {
  await chrome.storage.local.set({
    projects: projects,
  });
}

async function setActiveProject(id) {
  if (activeProjectId === id) {
    activeProjectId = null;
  } else {
    activeProjectId = id;
  }

  await chrome.storage.local.set({
    activeProjectId: activeProjectId,
  });

  saveStatus.textContent = '';

  renderProjects();
}

async function saveCurrentPage() {
  if (!activeProjectId) {
    saveStatus.textContent = 'Select a project first.';
    return;
  }

  if (!currentTab || !currentTab.url) {
    saveStatus.textContent = 'No page available to save.';
    return;
  }

  const source = {
    id: crypto.randomUUID(),
    projectId: activeProjectId,
    title: currentTab.title || 'Untitled page',
    url: currentTab.url,
    savedAt: new Date().toISOString(),
  };

  sources.push(source);

  await chrome.storage.local.set({
    sources: sources,
  });

  renderProjects();

  saveStatus.textContent = 'Page saved.';
}

async function removeSource(id) {
  const source = sources.find((source) => source.id === id);

  if (!source) {
    return;
  }

  const confirmed = confirm(`Remove "${source.title}" from this project?`);

  if (!confirmed) {
    return;
  }

  sources = sources.filter((source) => source.id !== id);

  await chrome.storage.local.set({
    sources: sources,
  });

  renderProjects();
}

function renderProjects() {
  projectList.innerHTML = '';

  if (projects.length === 0) {
    projectList.innerHTML = `
      <div class="empty-state">
        No projects yet.
      </div>
    `;

    savePageButton.disabled = true;

    return;
  }

  for (const project of projects) {
    const projectElement = document.createElement('div');

    projectElement.className = 'project';

    if (project.id === activeProjectId) {
      projectElement.classList.add('active');
    }

    const projectHeader = document.createElement('div');

    projectHeader.className = 'project-header';

    projectHeader.addEventListener('click', () => {
      setActiveProject(project.id);
    });

    const projectMain = document.createElement('div');

    projectMain.className = 'project-main';

    const arrow = document.createElement('span');

    arrow.className = 'project-arrow';
    arrow.textContent = '›';

    const projectName = document.createElement('span');

    const pageCount = sources.filter(
      (source) => source.projectId === project.id,
    ).length;

    const projectCount = document.createElement('span');

    projectCount.className = 'project-count';
    projectCount.textContent =
      pageCount === 1 ? '1 page' : `${pageCount} pages`;

    projectName.className = 'project-name';
    projectName.textContent = project.name;

    projectMain.appendChild(arrow);
    projectMain.appendChild(projectName);
    projectMain.appendChild(projectCount);

    const deleteButton = document.createElement('button');

    deleteButton.className = 'delete-project';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();

      deleteProject(project.id);
    });

    projectHeader.appendChild(projectMain);
    projectHeader.appendChild(deleteButton);

    const projectSources = document.createElement('div');

    projectSources.className = 'project-sources';

    const savedSources = sources.filter(
      (source) => source.projectId === project.id,
    );

    if (savedSources.length === 0) {
      const emptySources = document.createElement('div');

      emptySources.className = 'empty-sources';
      emptySources.textContent = 'No saved pages yet.';

      projectSources.appendChild(emptySources);
    } else {
      for (const source of savedSources) {
        const sourceElement = document.createElement('div');

        sourceElement.className = 'source-item';

        const sourceTitle = document.createElement('button');

        sourceTitle.className = 'source-link';
        sourceTitle.textContent = source.title;

        sourceTitle.addEventListener('click', () => {
          chrome.tabs.create({
            url: source.url,
          });
        });

        const sourceUrl = document.createElement('div');

        sourceUrl.className = 'source-url';
        sourceUrl.textContent = source.url;

        sourceElement.appendChild(sourceTitle);
        sourceElement.appendChild(sourceUrl);

        projectSources.appendChild(sourceElement);
      }
    }

    projectElement.appendChild(projectHeader);
    projectElement.appendChild(projectSources);

    projectList.appendChild(projectElement);
  }

  savePageButton.disabled = !activeProjectId;
}

async function loadCurrentPage() {
  const tabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  currentTab = tabs[0];

  if (!currentTab) {
    currentPageTitle.textContent = 'No page found';
    currentPageUrl.textContent = '';
    return;
  }

  currentPageTitle.textContent = currentTab.title || 'Untitled page';
  currentPageUrl.textContent = currentTab.url || '';
}
