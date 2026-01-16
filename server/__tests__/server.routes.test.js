import request from 'supertest';
import app from '../index.js';

describe('server routes', () => {
  it('GET / responds with health message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Hello From PlaceYourPrintStudio Server',
    });
  });

  it('POST /api/v1/auth/signup returns 400 when idToken is missing', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({ message: 'ID token is required' });
  });

  it('POST /api/v1/meshy/text-to-3d returns 500 when API key missing', async () => {
    const response = await request(app)
      .post('/api/v1/meshy/text-to-3d')
      .send({ prompt: 'test' });
    expect(response.status).toBe(500);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Meshy API key is not configured on the server.',
    });
  });
});
