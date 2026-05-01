const test = require('node:test');
const assert = require('node:assert');
const learningMaterialController = require('../controllers/learningMaterialController');
const db = require('../config/db');

// Mock db.query
const originalDbQuery = db.query;

test('Learning Material Controller - Authorization & Isolation Tests', async (t) => {
    
    t.afterEach(() => {
        // Restore db.query after each test
        db.query = originalDbQuery;
    });

    await t.test('getAllMaterials - Teacher only gets their own classes', async () => {
        let executedQuery = '';
        db.query = async (query, params) => {
            executedQuery = query;
            return [[]]; // return empty array of materials
        };

        const req = {
            user: { role: 'Teacher', userId: 42 }
        };

        const res = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
            }
        };

        await learningMaterialController.getAllMaterials(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.ok(executedQuery.includes('JOIN classes c ON m.class_id = c.id'));
        assert.ok(executedQuery.includes('JOIN teachers t ON c.teacher_id = t.id'));
        assert.ok(executedQuery.includes('WHERE t.user_id = ?'));
    });

    await t.test('getAllMaterials - Admin gets all', async () => {
        let executedQuery = '';
        db.query = async (query, params) => {
            executedQuery = query;
            return [[]];
        };

        const req = {
            user: { role: 'Admin', userId: 1 }
        };
        const res = { status: (c) => ({ json: () => {} }) };

        await learningMaterialController.getAllMaterials(req, res);

        assert.ok(!executedQuery.includes('WHERE t.user_id = ?'));
        assert.ok(!executedQuery.includes('JOIN classes'));
    });

    await t.test('createMaterial - Blocked if Teacher tries to add to unowned class', async () => {
        db.query = async (query, params) => {
            if (query.includes('SELECT c.id FROM classes c')) {
                // Mock: Teacher does not own this class
                return [[]]; 
            }
            return [[]];
        };

        const req = {
            user: { role: 'Teacher', userId: 42 },
            params: { classId: 99 },
            body: { name: 'Test', description: 'Test', url: 'http://test' }
        };

        let responseStatusCode;
        const res = {
            status: function(code) {
                responseStatusCode = code;
                return this;
            },
            json: function(data) {}
        };

        await learningMaterialController.createMaterial(req, res);

        assert.strictEqual(responseStatusCode, 403);
    });

    await t.test('deleteMaterial - Blocked if Teacher tries to delete unowned material', async () => {
        db.query = async (query, params) => {
            if (query.includes('SELECT class_id FROM learning_materials')) {
                return [[{ class_id: 99 }]];
            }
            if (query.includes('SELECT c.id FROM classes c')) {
                return [[]]; // Teacher doesn't own class 99
            }
            return [[]];
        };

        const req = {
            user: { role: 'Teacher', userId: 42 },
            params: { id: 10 }
        };

        let responseStatusCode;
        const res = {
            status: function(code) {
                responseStatusCode = code;
                return this;
            },
            json: function(data) {}
        };

        await learningMaterialController.deleteMaterial(req, res);

        assert.strictEqual(responseStatusCode, 403);
    });

});
