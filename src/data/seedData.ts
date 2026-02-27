import type { SeedData } from '../types'

const seedData: SeedData = {
  people: [
    { id: 'p1', name: 'Zack Burgess', email: 'zack.burgess@hey.com', title: 'Product Manager and Builder', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: true },
    { id: 'p2', name: 'Alice Chen', email: 'alice.chen@acme.com', title: 'Software Engineer', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p3', name: 'Marcus Webb', email: 'marcus.webb@acme.com', title: 'Senior Software Engineer', organization: 'Security', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p4', name: 'Jordan Park', email: 'jordan.park@acme.com', title: 'Engineering Manager', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p5', name: 'Sofia Rodriguez', email: 'sofia.rodriguez@acme.com', title: 'Product Manager', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p6', name: 'Emily Torres', email: 'emily.torres@acme.com', title: 'Designer', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p7', name: 'Aisha Patel', email: 'aisha.patel@acme.com', title: 'UX Researcher', organization: 'Research and Development', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p8', name: "Ryan O'Brien", email: 'ryan.obrien@acme.com', title: 'Recruiter', organization: 'Human Resources', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p9', name: 'Chris Lee', email: 'chris.lee@acme.com', title: 'Data Analyst', organization: 'Data & Analytics', status: 'SUSPENDED', isSystemAdmin: false },
    { id: 'p10', name: 'James Wilson', email: 'james.wilson@acme.com', title: 'Marketing Manager', organization: 'Marketing', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p11', name: 'Ethan Davis', email: 'ethan.davis@acme.com', title: 'Account Executive', organization: 'Sales', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p12', name: 'Hannah Thompson', email: 'hannah.thompson@acme.com', title: 'HR Manager', organization: 'Human Resources', status: 'ACTIVE', isSystemAdmin: false },
    { id: 'p13', name: 'Noah Garcia', email: 'noah.garcia@acme.com', title: 'Legal Counsel', organization: 'Legal', status: 'ACTIVE', isSystemAdmin: false },
  ],

  groups: [
    { id: 'g1', name: 'All Employees', description: 'Every person at Acme.', membershipSetting: 'ADMIN_ONLY' },
    { id: 'g2', name: 'Engineers', description: 'Software engineers and engineering managers.', membershipSetting: 'OPEN' },
    { id: 'g3', name: 'R&D', description: 'Research and Development department.', membershipSetting: 'ADMIN_ONLY' },
    { id: 'g4', name: 'Product', description: 'Product managers and builders.', membershipSetting: 'OPEN' },
    { id: 'g5', name: 'Design', description: 'Designers and UX researchers.', membershipSetting: 'OPEN' },
    { id: 'g6', name: 'Recruiting', description: 'Recruiting team.', membershipSetting: 'OPEN' },
  ],

  memberships: [
    // All Employees — all 13 people; Zack is admin
    { groupId: 'g1', personId: 'p1', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p2', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p3', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p4', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p5', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p6', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p7', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p8', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p10', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p11', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p12', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g1', personId: 'p13', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    // Engineers — Alice (p2), Marcus (p3), Jordan (p4); Jordan is admin
    { groupId: 'g2', personId: 'p4', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g2', personId: 'p2', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g2', personId: 'p3', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    // R&D — Zack, Alice, Jordan, Sofia, Emily, Aisha; Zack is admin
    { groupId: 'g3', personId: 'p1', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g3', personId: 'p2', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g3', personId: 'p4', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g3', personId: 'p5', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g3', personId: 'p6', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g3', personId: 'p7', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    // Product — Sofia (p5), Zack (p1); Sofia is admin
    { groupId: 'g4', personId: 'p5', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g4', personId: 'p1', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    // Design — Emily (p6), Aisha (p7); Emily is admin
    { groupId: 'g5', personId: 'p6', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    { groupId: 'g5', personId: 'p7', role: 'MEMBER', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
    // Recruiting — Ryan (p8); Ryan is admin
    { groupId: 'g6', personId: 'p8', role: 'ADMIN', addedAt: '2025-01-01T09:00:00.000Z', addedBy: 'SYSTEM' },
  ],

  changeEvents: [
    // All Employees — Zack creates group (09:00), AM adds everyone else (09:05); Chris later removed on suspension
    { id: 'ce1',  groupId: 'g1', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p1',  personName: 'Zack Burgess' },      timestamp: '2025-01-01T09:00:00.000Z' },
    { id: 'ce2',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p2',  personName: 'Alice Chen',        trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce3',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p3',  personName: 'Marcus Webb',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce4',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p4',  personName: 'Jordan Park',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce5',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p5',  personName: 'Sofia Rodriguez',   trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce6',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p6',  personName: 'Emily Torres',      trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce7',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p7',  personName: 'Aisha Patel',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce8',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p8',  personName: "Ryan O'Brien",      trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce9',  groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p9',  personName: 'Chris Lee',         trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce10', groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p10', personName: 'James Wilson',      trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce11', groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p11', personName: 'Ethan Davis',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce12', groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p12', personName: 'Hannah Thompson',   trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce13', groupId: 'g1', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p13', personName: 'Noah Garcia',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce14', groupId: 'g1', actorType: 'PERSON',               actorId: null, eventType: 'MEMBER_REMOVED', payload: { personId: 'p9',  personName: 'Chris Lee' },          timestamp: '2025-02-15T10:00:00.000Z' },
    // Engineers — Jordan creates group (09:00), AM adds Alice + Marcus (09:05)
    { id: 'ce15', groupId: 'g2', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p4',  personName: 'Jordan Park' },        timestamp: '2025-01-01T09:00:00.000Z' },
    { id: 'ce16', groupId: 'g2', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p2',  personName: 'Alice Chen',        trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce17', groupId: 'g2', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p3',  personName: 'Marcus Webb',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    // R&D — Zack creates group (09:00), AM adds everyone else (09:05)
    { id: 'ce18', groupId: 'g3', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p1',  personName: 'Zack Burgess' },      timestamp: '2025-01-01T09:00:00.000Z' },
    { id: 'ce19', groupId: 'g3', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p2',  personName: 'Alice Chen',        trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce20', groupId: 'g3', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p4',  personName: 'Jordan Park',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce21', groupId: 'g3', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p5',  personName: 'Sofia Rodriguez',   trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce22', groupId: 'g3', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p6',  personName: 'Emily Torres',      trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    { id: 'ce23', groupId: 'g3', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p7',  personName: 'Aisha Patel',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    // Product — Sofia creates group (09:00), AM adds Zack (09:05)
    { id: 'ce24', groupId: 'g4', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p5',  personName: 'Sofia Rodriguez' },    timestamp: '2025-01-01T09:00:00.000Z' },
    { id: 'ce25', groupId: 'g4', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p1',  personName: 'Zack Burgess',      trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    // Design — Emily creates group (09:00), AM adds Aisha (09:05)
    { id: 'ce26', groupId: 'g5', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p6',  personName: 'Emily Torres' },       timestamp: '2025-01-01T09:00:00.000Z' },
    { id: 'ce27', groupId: 'g5', actorType: 'AUTOMATIC_MEMBERSHIP', actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p7',  personName: 'Aisha Patel',       trigger: 'CREATE_REHIRE' }, timestamp: '2025-01-01T09:05:00.000Z' },
    // Recruiting — Ryan added at group creation
    { id: 'ce28', groupId: 'g6', actorType: 'GROUP_CREATED',        actorId: null, eventType: 'MEMBER_ADDED',   payload: { personId: 'p8',  personName: "Ryan O'Brien" },       timestamp: '2025-01-01T09:00:00.000Z' },
  ],

  autoMembershipRules: [
    {
      groupId: 'g1',
      conditions: [{ field: 'email', operator: 'contains', value: '@' }],
      combinator: 'AND',
      triggerOnUpdate: true,
    },
    {
      groupId: 'g2',
      conditions: [{ field: 'title', operator: 'is_one_of', value: ['Software Engineer', 'Senior Software Engineer', 'Engineering Manager'] }],
      combinator: 'AND',
      triggerOnUpdate: true,
    },
    {
      groupId: 'g3',
      conditions: [{ field: 'organization', operator: 'is', value: 'Research and Development' }],
      combinator: 'AND',
      triggerOnUpdate: false,
    },
    {
      groupId: 'g4',
      conditions: [{ field: 'title', operator: 'is_one_of', value: ['Product Manager', 'Product Manager and Builder'] }],
      combinator: 'AND',
      triggerOnUpdate: false,
    },
    {
      groupId: 'g5',
      conditions: [{ field: 'title', operator: 'is_one_of', value: ['Designer', 'UX Researcher'] }],
      combinator: 'AND',
      triggerOnUpdate: true,
    },
  ],
}

export default seedData
