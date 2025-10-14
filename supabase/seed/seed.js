/* eslint-env node */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey
  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const testingUserEmail = process.env.TESTING_USER_EMAIL
const testingUserPassword = process.env.TESTING_USER_PASSWORD
if (!testingUserEmail) {
  console.error('Have you forgot to add TESTING_USER_EMAIL to your .env file?')
  process.exit()
}

const logErrorAndExit = (tableName, error) => {
  console.error(
    `An error occurred in table '${tableName}' with code ${error.code}: ${error.message}`
  )
  process.exit(1)
}

const logStep = (stepMessage) => {
  console.info(stepMessage)
}

/**
 * @returns {Promise<string | null>}
 */

const createPrimaryTestUser = async () => {
  logStep('Creating primary test user...')
  const firstName = 'Test'
  const lastName = 'Account'
  const userName = 'testaccount1'

  const { data, error } = await supabase.auth.signUp({
    email: testingUserEmail,
    password: testingUserPassword,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        full_name: firstName + ' ' + lastName,
        username: userName
      }
    }
  })

  if (error) {
    logErrorAndExit('Users', error)
  }

  if (data) {
    const userId = data.user.id
    await supabase.from('profiles').insert({
      id: userId,
      full_name: firstName + ' ' + lastName,
      username: userName,
      bio: 'The main testing account',
      avatar_url: `https://i.pravatar.cc/150?u=${data.user.id}`,
      organization_id: null,
      role: 'super_admin'
    })

    logStep('Primary test user created successfully.')
    return userId
  }
}

const seedOrganizations = async () => {
  logStep('Seeding organizations...')
  const organizations = [
    {
      name: 'Uninorte',
      bio: 'Instituição de ensino superior em Manaus/AM, referência na Amazônia. Oferece cursos de graduação, pós-graduação e extensão, com foco em inovação, qualidade acadêmica e impacto social. Formamos profissionais preparados para transformar vidas e comunidades.',
      logo_url: 'https://ser.responsavel.app.br/logo/logoUninorteFB.jpg',
      address_cep: '69020-030',
      address_street: 'Av. Joaquim Nabuco',
      address_number: '1281',
      address_complement: 'Bloco A',
      address_neighborhood: 'Centro',
      address_city: 'Manaus',
      address_state: 'AM'
    },
    {
      name: 'StdOut Dev',
      bio: 'Fábrica de software especializada em soluções digitais sob medida. Atuamos no desenvolvimento de sistemas web, APIs e integrações, unindo inovação, qualidade e agilidade para transformar ideias em tecnologia de impacto.',
      logo_url: 'https://ser.responsavel.app.br/logo/logoStdNeonWhite_500x500.png',
      address_cep: '60115-282',
      address_street: 'Rua Maria Tomásia',
      address_number: '531',
      address_complement: 'Sala 1201',
      address_neighborhood: 'Aldeota',
      address_city: 'Fortaleza',
      address_state: 'CE'
    }
  ]

  const { data, error } = await supabase
    .from('organizations')
    .insert(organizations)
    .select('id, name')

  if (error) return logErrorAndExit('Organizations', error)

  logStep('Organizations seeded successfully.')

  const enriched = []
  for (const row of data ?? []) {
    const meta = organizations.find(item => item.name === row.name)
    if (meta) {
      enriched.push({ id: row.id, ...meta })
    }
  }

  return enriched
}

const seedDatabase = async () => {
  await seedOrganizations()

  await createPrimaryTestUser()
}

const runSeed = async () => {
  try {
    await seedDatabase()
    logStep('DatabaseTypes seeded successfully.')
    process.exit(0)
  } catch (error) {
    console.error('Unexpected error while seeding database:', error)
    process.exit(1)
  }
}

void runSeed()
