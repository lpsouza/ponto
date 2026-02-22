import { describe, it, expect, vi, beforeEach } from 'vitest'
import { companyService } from './companyService'
import { pb } from '../../../lib/pocketbase'

// Mock the pocketbase client
vi.mock('../../../lib/pocketbase', () => ({
    pb: {
        collection: vi.fn(),
        authStore: {
            model: { id: 'user-123' }
        }
    }
}))

describe('companyService', () => {
    const mockCollection = {
        getFullList: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // @ts-ignore
        pb.collection.mockReturnValue(mockCollection)
    })

    it('should fetch companies', async () => {
        const mockCompanies = [{ id: '1', name: 'Company 1' }]
        mockCollection.getFullList.mockResolvedValue(mockCompanies)

        const result = await companyService.getCompanies()

        expect(pb.collection).toHaveBeenCalledWith('companies')
        expect(mockCollection.getFullList).toHaveBeenCalled()
        expect(result).toEqual(mockCompanies)
    })

    it('should create a company with current user id', async () => {
        const companyData = { name: 'New Company', settings: { hours: 8 } }
        mockCollection.create.mockResolvedValue({ id: 'new-id', ...companyData })

        const result = await companyService.createCompany(companyData.name, companyData.settings)

        expect(mockCollection.create).toHaveBeenCalledWith({
            name: companyData.name,
            user: 'user-123',
            settings: companyData.settings
        })
        expect(result.id).toBe('new-id')
    })

    it('should error if creating company without auth', async () => {
        // @ts-ignore
        pb.authStore.model = null

        await expect(companyService.createCompany('Fail')).rejects.toThrow('User must be authenticated')

        // Restore for other tests
        // @ts-ignore
        pb.authStore.model = { id: 'user-123' }
    })

    it('should handle creation error', async () => {
        mockCollection.create.mockRejectedValue({ data: 'Some error' })
        await expect(companyService.createCompany('Fail')).rejects.toEqual({ data: 'Some error' })
    })

    it('should update a company', async () => {
        mockCollection.update.mockResolvedValue({ id: '1', name: 'Updated' })

        const result = await companyService.updateCompany('1', 'Updated', { hours: 9 })

        expect(mockCollection.update).toHaveBeenCalledWith('1', {
            name: 'Updated',
            settings: { hours: 9 }
        })
        expect(result.name).toBe('Updated')
    })

    it('should delete a company', async () => {
        mockCollection.delete.mockResolvedValue(true)

        const result = await companyService.deleteCompany('1')

        expect(mockCollection.delete).toHaveBeenCalledWith('1')
        expect(result).toBe(true)
    })
})
