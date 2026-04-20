import { personService } from '../services/personService.js';

export const personController = {
  async list(req, res) {
    try {
      const persons = await personService.findAll(req.query);
      res.json({ success: true, data: persons });
    } catch (error) {
      console.error('Error listing persons:', error);
      res.status(500).json({ success: false, error: 'Failed to list persons' });
    }
  },

  async getById(req, res) {
    try {
      const { id } = req.params;
      const person = await personService.findById(id);

      if (!person) {
        return res.status(404).json({ success: false, error: 'Person not found' });
      }

      res.json({ success: true, data: person });
    } catch (error) {
      console.error('Error getting person:', error);
      res.status(500).json({ success: false, error: 'Failed to get person' });
    }
  },

  async create(req, res) {
    try {
      const person = await personService.create(req.body);
      res.status(201).json({ success: true, data: person });
    } catch (error) {
      console.error('Error creating person:', error);
      res.status(500).json({ success: false, error: 'Failed to create person' });
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const person = await personService.update(id, req.body);
      res.json({ success: true, data: person });
    } catch (error) {
      console.error('Error updating person:', error);
      res.status(500).json({ success: false, error: 'Failed to update person' });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;
      await personService.delete(id);
      res.json({ success: true, data: { message: 'Person deleted' } });
    } catch (error) {
      console.error('Error deleting person:', error);
      res.status(500).json({ success: false, error: 'Failed to delete person' });
    }
  },
};
