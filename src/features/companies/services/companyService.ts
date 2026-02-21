import { pb } from '../../../lib/pocketbase'
import type { Company } from '../../../types/pocketbase-types'
import { CollectionName } from '../../../types/pocketbase-types'

export const companyService = {
    async getCompanies() {
        return await pb.collection(CollectionName.Companies).getFullList<Company>()
    },

    async createCompany(name: string, settings: any = {}) {
        if (!pb.authStore.model) throw new Error('User must be authenticated')

        return await pb.collection(CollectionName.Companies).create<Company>({
            name,
            user: pb.authStore.model.id,
            settings
        })
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
