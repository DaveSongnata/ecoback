import { BaseSeeder } from '@adonisjs/lucid/seeders'
import OccurrenceCategory from '#models/occurrence_category'

export default class OccurrenceCategorySeeder extends BaseSeeder {
  async run() {
    const categories = [
      { slug: 'organic', name: 'Orgânico' },
      { slug: 'recyclable', name: 'Reciclável' },
      { slug: 'special', name: 'Especial' },
      { slug: 'hospital', name: 'Hospitalar' },
      { slug: 'others', name: 'Outros' },
    ]

    for (const data of categories) {
      await OccurrenceCategory.updateOrCreate({ slug: data.slug }, data)
    }
  }
}
