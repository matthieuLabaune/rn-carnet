jest.mock('../../../services/database', () => ({
    initDatabase: jest.fn(),
    getDatabase: jest.fn(() => global.mockDb),
    closeDatabase: jest.fn(),
    resetDatabase: jest.fn(),
}));

import { competenceService } from '../../../services/competenceService';

declare global {
    var mockDb: any;
}

describe('competenceService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAll', () => {
        it('should return all competences ordered by domain and name', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'comp-1',
                    nom: 'Addition',
                    description: 'Savoir additionner',
                    domaine: 'Mathématiques',
                    couleur: '#4CAF50',
                    is_predefined: 1,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'comp-2',
                    nom: 'Lecture',
                    description: 'Lire un texte',
                    domaine: 'Français',
                    couleur: '#2196F3',
                    is_predefined: 0,
                    created_at: '2024-01-02',
                    updated_at: '2024-01-02',
                },
            ]);

            const result = await competenceService.getAll();

            expect(result).toHaveLength(2);
            expect(result[0].nom).toBe('Addition');
            expect(result[0].isPredefined).toBe(true);
            expect(result[1].isPredefined).toBe(false);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM competences')
            );
        });

        it('should return empty array when no competences exist', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([]);

            const result = await competenceService.getAll();

            expect(result).toHaveLength(0);
        });
    });

    describe('getByDomain', () => {
        it('should return competences for a specific domain', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'comp-1',
                    nom: 'Addition',
                    description: 'Savoir additionner',
                    domaine: 'Mathématiques',
                    couleur: '#4CAF50',
                    is_predefined: 1,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
                {
                    id: 'comp-2',
                    nom: 'Multiplication',
                    description: 'Savoir multiplier',
                    domaine: 'Mathématiques',
                    couleur: '#4CAF50',
                    is_predefined: 1,
                    created_at: '2024-01-02',
                    updated_at: '2024-01-02',
                },
            ]);

            const result = await competenceService.getByDomain('Mathématiques');

            expect(result).toHaveLength(2);
            expect(result[0].domaine).toBe('Mathématiques');
            expect(result[1].domaine).toBe('Mathématiques');
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE domaine = ?'),
                ['Mathématiques']
            );
        });
    });

    describe('getPredefined', () => {
        it('should return only predefined competences', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'comp-1',
                    nom: 'Compétence officielle',
                    description: 'Du socle commun',
                    domaine: 'Mathématiques',
                    couleur: '#4CAF50',
                    is_predefined: 1,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await competenceService.getPredefined();

            expect(result).toHaveLength(1);
            expect(result[0].isPredefined).toBe(true);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE is_predefined = 1')
            );
        });
    });

    describe('getCustom', () => {
        it('should return only custom competences', async () => {
            global.mockDb.getAllAsync.mockResolvedValue([
                {
                    id: 'comp-custom',
                    nom: 'Ma compétence perso',
                    description: 'Créée par enseignant',
                    domaine: 'Autre',
                    couleur: '#FF5722',
                    is_predefined: 0,
                    created_at: '2024-01-01',
                    updated_at: '2024-01-01',
                },
            ]);

            const result = await competenceService.getCustom();

            expect(result).toHaveLength(1);
            expect(result[0].isPredefined).toBe(false);
            expect(global.mockDb.getAllAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE is_predefined = 0')
            );
        });
    });

    describe('getById', () => {
        it('should return a competence by id', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue({
                id: 'comp-1',
                nom: 'Grammaire',
                description: 'Analyse grammaticale',
                domaine: 'Français',
                couleur: '#2196F3',
                is_predefined: 1,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            });

            const result = await competenceService.getById('comp-1');

            expect(result).toBeDefined();
            expect(result?.nom).toBe('Grammaire');
            expect(result?.domaine).toBe('Français');
            expect(global.mockDb.getFirstAsync).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ?'),
                ['comp-1']
            );
        });

        it('should return null when competence not found', async () => {
            global.mockDb.getFirstAsync.mockResolvedValue(null);

            const result = await competenceService.getById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new custom competence', async () => {
            const newComp = {
                id: 'comp-new',
                nom: 'Nouvelle compétence',
                description: 'Description test',
                domaine: 'Sciences' as const,
                couleur: '#9C27B0',
                isPredefined: false,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 1,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: newComp.id,
                nom: newComp.nom,
                description: newComp.description,
                domaine: newComp.domaine,
                couleur: newComp.couleur,
                is_predefined: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await competenceService.create(newComp);

            expect(result).toBeDefined();
            expect(result.nom).toBe(newComp.nom);
            expect(result.isPredefined).toBe(false);
            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should create a predefined competence', async () => {
            const newComp = {
                id: 'comp-predefined',
                nom: 'Compétence officielle',
                description: 'Du programme',
                domaine: 'Mathématiques' as const,
                couleur: '#4CAF50',
                isPredefined: true,
            };

            global.mockDb.runAsync.mockResolvedValue({
                lastInsertRowId: 2,
                changes: 1,
            });

            global.mockDb.getFirstAsync.mockResolvedValue({
                id: newComp.id,
                nom: newComp.nom,
                description: newComp.description,
                domaine: newComp.domaine,
                couleur: newComp.couleur,
                is_predefined: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });

            const result = await competenceService.create(newComp);

            expect(result).toBeDefined();
            expect(result.isPredefined).toBe(true);
        });
    });

    describe('update', () => {
        it('should update an existing competence', async () => {
            const existing = {
                id: 'comp-1',
                nom: 'Old Name',
                description: 'Old desc',
                domaine: 'Mathématiques',
                couleur: '#4CAF50',
                is_predefined: 0,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            global.mockDb.getFirstAsync
                .mockResolvedValueOnce(existing)
                .mockResolvedValueOnce({
                    ...existing,
                    nom: 'New Name',
                    description: 'New desc',
                });

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            const updates = { nom: 'New Name', description: 'New desc' };
            await competenceService.update('comp-1', updates);

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });

        it('should handle update errors', async () => {
            global.mockDb.runAsync.mockRejectedValue(new Error('Update failed'));

            await expect(
                competenceService.update('nonexistent-id', {
                    nom: 'Test',
                })
            ).rejects.toThrow('Update failed');
        });
    });

    describe('delete', () => {
        it('should delete a competence', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await competenceService.delete('comp-1');

            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM competences'),
                ['comp-1']
            );
        });

        it('should handle cascade deletes', async () => {
            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await competenceService.delete('comp-1');

            expect(global.mockDb.runAsync).toHaveBeenCalled();
        });
    });

    describe('bulkInsert', () => {
        it('should insert multiple competences', async () => {
            const competences = [
                {
                    id: 'comp-bulk-1',
                    nom: 'Comp 1',
                    description: 'Desc 1',
                    domaine: 'Mathématiques' as const,
                    couleur: '#4CAF50',
                    isPredefined: true,
                },
                {
                    id: 'comp-bulk-2',
                    nom: 'Comp 2',
                    description: 'Desc 2',
                    domaine: 'Français' as const,
                    couleur: '#2196F3',
                    isPredefined: true,
                },
            ];

            global.mockDb.runAsync.mockResolvedValue({ changes: 1 });

            await competenceService.bulkInsert(competences);

            expect(global.mockDb.runAsync).toHaveBeenCalledTimes(2);
            expect(global.mockDb.runAsync).toHaveBeenCalledWith(
                expect.stringContaining('INSERT OR IGNORE'),
                expect.any(Array)
            );
        });
    });
});
