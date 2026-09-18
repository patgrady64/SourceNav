const projectNameInput = document.getElementById('projectName');
const addProjectButton = document.getElementById('addProject');
const projectList = document.getElementById('projectList');
const currentPageTitle = document.getElementById('currentPageTitle');
const currentPageUrl = document.getElementById('currentPageUrl');
const savePageTitle = document.getElementById('savePageTitle');
const savePageButton = document.getElementById('savePage');
const saveStatus = document.getElementById('saveStatus');

const sourceFlyout = document.getElementById('sourceFlyout');
const flyoutProjectName = document.getElementById('flyoutProjectName');
const flyoutPageCount = document.getElementById('flyoutPageCount');
const flyoutSources = document.getElementById('flyoutSources');

let projects = [];
let sources = [];
let activeProjectId = null;
let currentTab = null;
let hoveredProjectId = null;
let draggedProjectId = null;
let draggedSourceId = null;

loadData();
loadCurrentPage();

addProjectButton.addEventListener('click', addProject);
savePageButton.addEventListener('click', saveCurrentPage);

savePageTitle.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !savePageButton.disabled) {
    saveCurrentPage();
  }
});

sourceFlyout.addEventListener('mouseenter', () => {
  if (hoveredProjectId) {
    showFlyout(hoveredProjectId);
  }
});

sourceFlyout.addEventListener('mouseleave', () => {
  hoveredProjectId = null;

  if (activeProjectId) {
    showFlyout(activeProjectId);
  } else {
    hideFlyout();
  }
});

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

  if (activeProjectId) {
    showFlyout(activeProjectId);
  }
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

  if (hoveredProjectId === id) {
    hoveredProjectId = null;
  }

  await chrome.storage.local.set({
    projects: projects,
    sources: sources,
    activeProjectId: activeProjectId,
  });

  renderProjects();

  if (activeProjectId) {
    showFlyout(activeProjectId);
  } else {
    hideFlyout();
  }
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

  const projectId = source.projectId;

  sources = sources.filter((source) => source.id !== id);

  await chrome.storage.local.set({
    sources: sources,
  });

  renderProjects();
  showFlyout(projectId);
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

  if (activeProjectId) {
    showFlyout(activeProjectId);
  } else if (!hoveredProjectId) {
    hideFlyout();
  }
}

function normalizeUrl(url) {
  try {
    const normalized = new URL(url);

    normalized.hash = '';

    if (normalized.pathname.length > 1) {
      normalized.pathname = normalized.pathname.replace(/\/+$/, '');
    }

    return normalized.toString();
  } catch {
    return url;
  }
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

  const pageTitle = savePageTitle.value.trim();

  if (!pageTitle) {
    saveStatus.textContent = 'Enter a page name first.';
    savePageTitle.focus();
    return;
  }

  const currentUrl = normalizeUrl(currentTab.url);

  const duplicates = sources.filter(
    (source) => normalizeUrl(source.url) === currentUrl,
  );

  if (duplicates.length > 0) {
    const duplicateProjectNames = [
      ...new Set(
        duplicates
          .map((source) => {
            const project = projects.find(
              (project) => project.id === source.projectId,
            );

            return project ? project.name : null;
          })
          .filter(Boolean),
      ),
    ];

    let message = 'You already have this page saved.';

    if (duplicateProjectNames.length > 0) {
      message += `\n\nSaved in:\n${duplicateProjectNames.join('\n')}`;
    }

    message += '\n\nDo you want to save it again?';

    const saveAgain = confirm(message);

    if (!saveAgain) {
      saveStatus.textContent = 'Duplicate not saved.';
      return;
    }
  }

  const source = {
    id: crypto.randomUUID(),
    projectId: activeProjectId,
    title: pageTitle,
    url: currentTab.url,
    savedAt: new Date().toISOString(),
  };

  sources.push(source);

  await chrome.storage.local.set({
    sources: sources,
  });

  renderProjects();
  showFlyout(activeProjectId);

  saveStatus.textContent = 'Page saved.';
}

async function editProject(id) {
  const project = projects.find((project) => project.id === id);

  if (!project) {
    return;
  }

  const newName = prompt('Project name:', project.name);

  if (newName === null) {
    return;
  }

  const trimmedName = newName.trim();

  if (!trimmedName) {
    return;
  }

  project.name = trimmedName;

  await saveProjects();

  renderProjects();
  showFlyout(project.id);
}

async function editSource(id) {
  const source = sources.find((source) => source.id === id);

  if (!source) {
    return;
  }

  const newTitle = prompt('Page name:', source.title);

  if (newTitle === null) {
    return;
  }

  const trimmedTitle = newTitle.trim();

  if (!trimmedTitle) {
    return;
  }

  const newUrl = prompt('Page URL:', source.url);

  if (newUrl === null) {
    return;
  }

  const trimmedUrl = newUrl.trim();

  if (!trimmedUrl) {
    return;
  }

  source.title = trimmedTitle;
  source.url = trimmedUrl;

  await chrome.storage.local.set({
    sources: sources,
  });

  renderProjects();
  showFlyout(source.projectId);
}

async function reorderProject(draggedId, targetId, insertAfter) {
  if (draggedId === targetId) {
    return;
  }

  const draggedIndex = projects.findIndex(
    (project) => project.id === draggedId,
  );

  if (draggedIndex === -1) {
    return;
  }

  const [draggedProject] = projects.splice(draggedIndex, 1);

  let targetIndex = projects.findIndex((project) => project.id === targetId);

  if (targetIndex === -1) {
    return;
  }

  if (insertAfter) {
    targetIndex += 1;
  }

  projects.splice(targetIndex, 0, draggedProject);

  await saveProjects();

  renderProjects();
}

async function reorderSource(draggedId, targetId, insertAfter) {
  if (draggedId === targetId) {
    return;
  }

  const draggedSource = sources.find((source) => source.id === draggedId);
  const targetSource = sources.find((source) => source.id === targetId);

  if (!draggedSource || !targetSource) {
    return;
  }

  if (draggedSource.projectId !== targetSource.projectId) {
    return;
  }

  const projectId = draggedSource.projectId;
  const draggedIndex = sources.findIndex((source) => source.id === draggedId);

  if (draggedIndex === -1) {
    return;
  }

  const [sourceToMove] = sources.splice(draggedIndex, 1);

  let targetIndex = sources.findIndex((source) => source.id === targetId);

  if (targetIndex === -1) {
    sources.splice(draggedIndex, 0, sourceToMove);
    return;
  }

  if (insertAfter) {
    targetIndex += 1;
  }

  sources.splice(targetIndex, 0, sourceToMove);

  await chrome.storage.local.set({
    sources: sources,
  });

  showFlyout(projectId);
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
    hideFlyout();

    return;
  }

  for (const project of projects) {
    const projectElement = document.createElement('div');

    projectElement.className = 'project';

    if (project.id === activeProjectId) {
      projectElement.classList.add('active');
    }

    projectElement.addEventListener('mouseenter', () => {
      hoveredProjectId = project.id;

      showFlyout(project.id);
    });

    projectElement.addEventListener('mouseleave', () => {
      hoveredProjectId = null;

      setTimeout(() => {
        if (hoveredProjectId) {
          return;
        }

        if (sourceFlyout.matches(':hover')) {
          return;
        }

        if (activeProjectId) {
          showFlyout(activeProjectId);
        } else {
          hideFlyout();
        }
      }, 80);
    });

    projectElement.addEventListener('click', () => {
      setActiveProject(project.id);
    });

    projectElement.addEventListener('dragover', (event) => {
      if (!draggedProjectId) {
        return;
      }

      event.preventDefault();

      const rectangle = projectElement.getBoundingClientRect();

      const insertAfter = event.clientY > rectangle.top + rectangle.height / 2;

      projectElement.classList.remove('drag-before', 'drag-after');

      if (insertAfter) {
        projectElement.classList.add('drag-after');
      } else {
        projectElement.classList.add('drag-before');
      }
    });

    projectElement.addEventListener('dragleave', () => {
      projectElement.classList.remove('drag-before', 'drag-after');
    });

    projectElement.addEventListener('drop', async (event) => {
      event.preventDefault();

      const rectangle = projectElement.getBoundingClientRect();

      const insertAfter = event.clientY > rectangle.top + rectangle.height / 2;

      projectElement.classList.remove('drag-before', 'drag-after');

      if (!draggedProjectId) {
        return;
      }

      await reorderProject(draggedProjectId, project.id, insertAfter);

      draggedProjectId = null;
    });

    const projectMain = document.createElement('div');

    projectMain.className = 'project-main';

    const dragHandle = document.createElement('span');

    dragHandle.className = 'drag-handle';
    dragHandle.textContent = '☰';
    dragHandle.draggable = true;
    dragHandle.title = 'Drag to reorder';

    dragHandle.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    dragHandle.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    dragHandle.addEventListener('dragstart', (event) => {
      draggedProjectId = project.id;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', project.id);

      projectElement.classList.add('dragging');
    });

    dragHandle.addEventListener('dragend', () => {
      draggedProjectId = null;

      projectElement.classList.remove('dragging');

      const projectElements = document.querySelectorAll('.project');

      for (const element of projectElements) {
        element.classList.remove('drag-before', 'drag-after');
      }
    });

    const projectName = document.createElement('span');

    projectName.className = 'project-name';
    projectName.textContent = project.name;

    const pageCount = sources.filter(
      (source) => source.projectId === project.id,
    ).length;

    const projectCount = document.createElement('span');

    projectCount.className = 'project-count';

    projectCount.textContent =
      pageCount === 1 ? '1 page' : `${pageCount} pages`;

    const arrow = document.createElement('span');

    arrow.className = 'project-arrow';
    arrow.textContent = '◀';

    projectMain.appendChild(dragHandle);
    projectMain.appendChild(projectName);
    projectMain.appendChild(projectCount);
    projectMain.appendChild(arrow);

    const projectActions = document.createElement('div');

    projectActions.className = 'project-actions';

    const editButton = document.createElement('button');

    editButton.className = 'edit-project';
    editButton.textContent = 'Edit';

    editButton.addEventListener('click', (event) => {
      event.stopPropagation();

      editProject(project.id);
    });

    const deleteButton = document.createElement('button');

    deleteButton.className = 'delete-project';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', (event) => {
      event.stopPropagation();

      deleteProject(project.id);
    });

    projectActions.appendChild(editButton);
    projectActions.appendChild(deleteButton);

    projectElement.appendChild(projectMain);
    projectElement.appendChild(projectActions);

    projectList.appendChild(projectElement);
  }

  savePageButton.disabled = !activeProjectId;
}

function showFlyout(projectId) {
  const project = projects.find((project) => project.id === projectId);

  if (!project) {
    hideFlyout();
    return;
  }

  document.body.classList.add('flyout-open');

  flyoutProjectName.textContent = project.name;

  const projectSources = sources.filter(
    (source) => source.projectId === projectId,
  );

  flyoutPageCount.textContent =
    projectSources.length === 1
      ? '1 saved page'
      : `${projectSources.length} saved pages`;

  flyoutSources.innerHTML = '';

  if (projectSources.length === 0) {
    flyoutSources.innerHTML = `
      <div class="empty-sources">
        No saved pages yet.
      </div>
    `;

    return;
  }

  for (const source of projectSources) {
    const sourceElement = document.createElement('div');

    sourceElement.className = 'flyout-source';

    sourceElement.addEventListener('dragover', (event) => {
      if (!draggedSourceId) {
        return;
      }

      event.preventDefault();

      const rectangle = sourceElement.getBoundingClientRect();
      const insertAfter = event.clientY > rectangle.top + rectangle.height / 2;

      sourceElement.classList.remove('drag-before', 'drag-after');

      if (insertAfter) {
        sourceElement.classList.add('drag-after');
      } else {
        sourceElement.classList.add('drag-before');
      }
    });

    sourceElement.addEventListener('dragleave', () => {
      sourceElement.classList.remove('drag-before', 'drag-after');
    });

    sourceElement.addEventListener('drop', async (event) => {
      if (!draggedSourceId) {
        return;
      }

      event.preventDefault();

      const rectangle = sourceElement.getBoundingClientRect();
      const insertAfter = event.clientY > rectangle.top + rectangle.height / 2;
      const sourceId = draggedSourceId;

      sourceElement.classList.remove('drag-before', 'drag-after');
      draggedSourceId = null;

      await reorderSource(sourceId, source.id, insertAfter);
    });

    const sourceHeader = document.createElement('div');

    sourceHeader.className = 'flyout-source-header';

    const sourceDragHandle = document.createElement('span');

    sourceDragHandle.className = 'drag-handle source-drag-handle';
    sourceDragHandle.textContent = '☰';
    sourceDragHandle.draggable = true;
    sourceDragHandle.title = 'Drag to reorder';

    sourceDragHandle.addEventListener('mousedown', (event) => {
      event.stopPropagation();
    });

    sourceDragHandle.addEventListener('dragstart', (event) => {
      draggedSourceId = source.id;

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', source.id);

      sourceElement.classList.add('dragging');
    });

    sourceDragHandle.addEventListener('dragend', () => {
      draggedSourceId = null;

      const sourceElements = document.querySelectorAll('.flyout-source');

      for (const element of sourceElements) {
        element.classList.remove('dragging', 'drag-before', 'drag-after');
      }
    });

    const sourceTitle = document.createElement('button');

    sourceTitle.className = 'source-link';
    sourceTitle.textContent = source.title;

    sourceTitle.addEventListener('click', async () => {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const activeTab = tabs[0];

      if (!activeTab?.id) {
        return;
      }

      await chrome.tabs.update(activeTab.id, {
        url: source.url,
      });
    });

    const editButton = document.createElement('button');

    editButton.className = 'edit-source';
    editButton.textContent = 'Edit';

    editButton.addEventListener('click', () => {
      editSource(source.id);
    });

    const removeButton = document.createElement('button');

    removeButton.className = 'remove-source';
    removeButton.textContent = 'Remove';

    removeButton.addEventListener('click', () => {
      removeSource(source.id);
    });

    const sourceUrl = document.createElement('div');

    sourceUrl.className = 'source-url';
    sourceUrl.textContent = source.url;

    sourceHeader.appendChild(sourceDragHandle);
    sourceHeader.appendChild(sourceTitle);
    sourceHeader.appendChild(editButton);
    sourceHeader.appendChild(removeButton);

    sourceElement.appendChild(sourceHeader);
    sourceElement.appendChild(sourceUrl);

    flyoutSources.appendChild(sourceElement);
  }
}

function hideFlyout() {
  document.body.classList.remove('flyout-open');
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
    savePageTitle.value = '';
    savePageTitle.disabled = true;
    return;
  }

  currentPageTitle.textContent = currentTab.title || 'Untitled page';
  currentPageUrl.textContent = currentTab.url || '';
  savePageTitle.value = currentTab.title || 'Untitled page';
  savePageTitle.disabled = false;
}
