import { pb } from '../../../lib/pocketbase'
import type { Company, CompanySettings } from '../../../types/pocketbase-types'
import { CollectionName } from '../../../types/pocketbase-types'
import { CLT_DEFAULTS } from '../../../lib/constants'

export const companyService = {
    async getCompanies() {
        return await pb.collection(CollectionName.Companies).getFullList<Company>({
            sort: 'created',
            requestKey: null
        })
    },

    async createCompany(name: string, settings: CompanySettings = CLT_DEFAULTS) {
        const authModel = pb.authStore.model
        if (!authModel) throw new Error('User must be authenticated')

        try {
            return await pb.collection(CollectionName.Companies).create<Company>({
                name,
                user: authModel.id,
                settings
            })
        } catch (error: any) {
            throw error
        }
    },

    async updateCompany(id: string, name: string, settings: CompanySettings) {
        return await pb.collection(CollectionName.Companies).update<Company>(id, {
            name,
            settings
        })
    },

    async updateSettings(id: string, settings: CompanySettings) {
        return await pb.collection(CollectionName.Companies).update<Company>(id, {
            settings
        })
    },

    async deleteCompany(id: string) {
        return await pb.collection(CollectionName.Companies).delete(id)
    }
}
