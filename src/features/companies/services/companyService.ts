import { pb } from '../../../lib/pocketbase'
import type { Company } from '../../../types/pocketbase-types'
import { CollectionName } from '../../../types/pocketbase-types'

export const companyService = {
    async getCompanies() {
        return await pb.collection(CollectionName.Companies).getFullList<Company>({
            requestKey: null
        })
    },

    async createCompany(name: string, settings: any = {}) {
        const authModel = pb.authStore.model
        if (!authModel) throw new Error('User must be authenticated')

        try {
            return await pb.collection(CollectionName.Companies).create<Company>({
                name,
                user: authModel.id,
                settings
            })
        } catch (error: any) {
            console.error('Error creating company details:', error.data)
            throw error
        }
    },

    async updateCompany(id: string, name: string, settings: any) {
        return await pb.collection(CollectionName.Companies).update<Company>(id, {
            name,
            settings
        })
    },

    async deleteCompany(id: string) {
        return await pb.collection(CollectionName.Companies).delete(id)
    }
}
