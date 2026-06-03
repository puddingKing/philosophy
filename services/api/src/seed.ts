import { config } from './config'
import { migrate } from './db/migrate'
import { createPhilosopher, countPhilosophers } from './db/philosophers'
import { countUsers, createUser } from './db/users'

const seedData = [
  {
    id: 'nietzsche',
    name: '尼采',
    nameEn: 'Friedrich Nietzsche',
    era: '1844–1900',
    school: '存在主义先驱',
    summary: '「上帝已死」的宣告者，强调权力意志与超人哲学。',
    biography: '弗里德里希·威廉·尼采，德国哲学家、古典语文学家。其思想对20世纪哲学、文学、心理学产生深远影响。',
    works: [
      { title: '查拉图斯特拉如是说', year: '1883–1885' },
      { title: '善恶的彼岸', year: '1886' },
      { title: '道德的谱系', year: '1887' },
    ],
  },
  {
    id: 'hegel',
    name: '黑格尔',
    nameEn: 'Georg Wilhelm Friedrich Hegel',
    era: '1770–1831',
    school: '德国观念论',
    summary: '辩证法的集大成者，提出绝对精神的自我实现历程。',
    biography: '格奥尔格·威廉·弗里德里希·黑格尔，德国哲学家，德国古典哲学的代表人物之一。',
    works: [
      { title: '精神现象学', year: '1807' },
      { title: '逻辑学', year: '1812–1816' },
      { title: '法哲学原理', year: '1821' },
    ],
  },
  {
    id: 'heidegger',
    name: '海德格尔',
    nameEn: 'Martin Heidegger',
    era: '1889–1976',
    school: '存在哲学',
    summary: '追问「存在」的意义，提出此在与向死而生的思想。',
    biography: '马丁·海德格尔，德国哲学家，20世纪存在主义与现象学的重要思想家。',
    works: [
      { title: '存在与时间', year: '1927' },
      { title: '荷尔德林诗的阐释', year: '1936' },
    ],
  },
  {
    id: 'kant',
    name: '康德',
    nameEn: 'Immanuel Kant',
    era: '1724–1804',
    school: '批判哲学',
    summary: '「哥白尼式革命」的发动者，综合理性主义与经验主义。',
    biography: '伊曼努尔·康德，德国哲学家，启蒙运动的核心人物，现代哲学奠基人之一。',
    works: [
      { title: '纯粹理性批判', year: '1781' },
      { title: '实践理性批判', year: '1788' },
      { title: '判断力批判', year: '1790' },
    ],
  },
  {
    id: 'plato',
    name: '柏拉图',
    nameEn: 'Plato',
    era: '前427–前347',
    school: '古典哲学',
    summary: '理念论的创立者，西方哲学传统的重要源头。',
    biography: '柏拉图，古希腊哲学家，苏格拉底的学生，亚里士多德的老师，阿卡ademy 的创始人。',
    works: [
      { title: '理想国', year: '前380' },
      { title: '会饮篇', year: '前385' },
      { title: '斐多篇', year: '前380' },
    ],
  },
  {
    id: 'socrates',
    name: '苏格拉底',
    nameEn: 'Socrates',
    era: '前470–前399',
    school: '古典哲学',
    summary: '「认识你自己」，以对话与诘问法闻名于世。',
    biography: '苏格拉底，古希腊哲学家，西方伦理学的奠基人，其思想主要通过柏拉图对话录流传。',
    works: [{ title: '申辩篇（柏拉图著）', year: '前399' }],
  },
  {
    id: 'wittgenstein',
    name: '维特根斯坦',
    nameEn: 'Ludwig Wittgenstein',
    era: '1889–1951',
    school: '分析哲学',
    summary: '语言的界限即世界的界限，前期与后期思想影响深远。',
    biography: '路德维希·维特根斯坦，奥地利-英国哲学家，20世纪最重要的哲学家之一。',
    works: [
      { title: '逻辑哲学论', year: '1921' },
      { title: '哲学研究', year: '1953' },
    ],
  },
  {
    id: 'sartre',
    name: '萨特',
    nameEn: 'Jean-Paul Sartre',
    era: '1905–1980',
    school: '存在主义',
    summary: '「存在先于本质」，强调人的自由与责任。',
    biography: '让-保罗·萨特，法国哲学家、作家，存在主义代表人物，1964年诺贝尔文学奖得主（拒绝领取）。',
    works: [
      { title: '存在与虚无', year: '1943' },
      { title: '存在主义是一种人道主义', year: '1946' },
    ],
  },
]

export async function seedDatabase() {
  await migrate()

  const userCount = await countUsers()
  if (userCount === 0) {
    await createUser(config.adminUsername, config.adminPassword)
    console.log(`Seeded admin user: ${config.adminUsername}`)
  }

  const philosopherCount = await countPhilosophers()
  if (philosopherCount > 0) {
    console.log('Philosophers already seeded, skipping.')
    return
  }

  for (const item of seedData) {
    await createPhilosopher(item)
  }
  console.log(`Seeded ${seedData.length} philosophers.`)
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
