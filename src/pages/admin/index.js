import AdminPickers from './Pickers';

export default {
  title: 'Admin',
  component: AdminPickers,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => {
      const container = document.createElement('div');
      container.innerHTML = `
        <div class="admin-container">
          <div class="admin-header">
            <h1>Admin</h1>
          </div>
          <div class="admin-content">
            <div class="admin-content-container">
              ${Story()}
            </div>
          </div>
        </div>
      `;
      return container;
    },
  ],
};