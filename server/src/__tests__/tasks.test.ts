import request from 'supertest';
import app from '../testapp';

describe('Tasks API', () => {
  let authToken: string;
  let userId: string;
  let taskId: string;

  beforeAll(async () => {
    // Create a test user
    const email = `test_${Date.now()}@billow.test`;
    const password = 'testpassword123';

    const registerRes = await request(app)
      .post('/auth/register')
      .send({ email, password, displayName: 'Test User' });

    expect(registerRes.status).toBe(201);
    authToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
  });

  describe('POST /tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'This is a test task',
          status: 'todo',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Test Task');
      expect(res.body.status).toBe('todo');
      expect(res.body.priority).toBe('high');

      taskId = res.body.id;
    });

    it('should fail without authentication', async () => {
      const res = await request(app)
        .post('/tasks')
        .send({ title: 'Unauthenticated Task' });

      expect(res.status).toBe(401);
    });

    it('should fail with invalid data', async () => {
      const res = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /tasks', () => {
    it('should get all tasks for user', async () => {
      const res = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('tasks');
      expect(Array.isArray(res.body.tasks)).toBe(true);
      expect(res.body.tasks.length).toBeGreaterThan(0);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/tasks?status=todo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks.every((t: any) => t.status === 'todo')).toBe(true);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get a single task', async () => {
      const res = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(taskId);
      expect(res.body.title).toBe('Test Task');
    });

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .get(`/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update a task', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Test Task',
          status: 'done'
        });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Test Task');
      expect(res.body.status).toBe('done');
      expect(res.body.completed_at).not.toBeNull();
    });

    it('should fail with invalid status', async () => {
      const res = await request(app)
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(204);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app)
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });
});

