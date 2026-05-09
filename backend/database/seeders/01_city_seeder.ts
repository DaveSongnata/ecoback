import { BaseSeeder } from '@adonisjs/lucid/seeders'
import City from '#models/city'

export default class CitySeeder extends BaseSeeder {
  async run() {
    const cities = [
      { name: 'Rio de Janeiro', ibgeCode: '3304557' },
      { name: 'São Paulo', ibgeCode: '3550308' },
      { name: 'Belo Horizonte', ibgeCode: '3106200' },
      { name: 'Curitiba', ibgeCode: '4106902' },
      { name: 'Salvador', ibgeCode: '2927408' },
    ]

    for (const data of cities) {
      await City.updateOrCreate({ ibgeCode: data.ibgeCode }, data)
    }
  }
}
