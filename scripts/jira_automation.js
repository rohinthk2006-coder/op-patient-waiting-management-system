/**
 * Jira Cloud REST API v3 Automation Script for Logic Legends (Hospital OP Live Tracker)
 * Built with native Node.js fetch (Node 18+)
 */

const fs = require('fs');
const path = require('path');

// Configuration from environment or .env file
const JIRA_BASE_URL = (process.env.JIRA_BASE_URL || '').replace(/\/+$/, '');
const JIRA_EMAIL = process.env.JIRA_EMAIL || 'rohinthk2006@gmail.com';
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || '';

const TEAM_MEMBERS = [
  { name: 'Rohinth', email: 'rohinthk2006@gmail.com', role: 'Project Owner & Lead Architect' },
  { name: 'Suhana', email: 'suhana6385@gmail.com', role: 'Frontend Lead & UI/UX Engineer' },
  { name: 'Vembu Santhini', email: 'vembusanthini11@gmail.com', role: 'Backend & API Specialist' },
  { name: 'Shahanaaz', email: 'shahanaaz247@gmail.com', role: 'AI/ML & QA Automation Lead' },
];

const EPICS = [
  {
    key: 'EPIC-1',
    summary: 'Epic 1: User Authentication & Role-Based Access Control (RBAC)',
    description: 'JWT Authentication and role-based permissions for Patients, Doctors, Receptionists, and Admins.',
    assigneeRole: 'Backend & API Specialist',
    stories: [
      {
        summary: 'Patient & Staff Registration and Login API',
        description: 'Provide JWT-based login/signup with role permissions and password hashing.',
        tasks: ['Implement Pydantic schemas', 'Implement bcrypt password hashing', 'Create JWT token service', 'Add tests']
      },
      {
        summary: 'Auth UI & Protected Routes',
        description: 'React login & registration views with Zod validation and route guards.',
        tasks: ['Build LoginForm component', 'Build RegisterForm component', 'Implement AuthContext and token storage']
      }
    ]
  },
  {
    key: 'EPIC-2',
    summary: 'Epic 2: Hospital, Department & Doctor Schedule Management',
    description: 'Management of hospital listings, OP consultation rooms, doctor rosters, shift timings, and token limits.',
    assigneeRole: 'Backend & API Specialist',
    stories: [
      {
        summary: 'Hospital and Department Catalog API',
        description: 'REST endpoints to manage and query hospitals, departments, and consultation rooms.',
        tasks: ['Create hospital and department models', 'Implement CRUD repository', 'Add public catalog endpoints']
      },
      {
        summary: 'Doctor Shift & Token Quota Definition',
        description: 'Configure doctor rosters, shifts, average consultation time, and daily token limits.',
        tasks: ['Define schedule schema', 'Implement quota validation', 'Build doctor schedule admin UI']
      }
    ]
  },
  {
    key: 'EPIC-3',
    summary: 'Epic 3: Online & Offline Multi-Channel Token Booking System',
    description: 'Atomic token booking for online patients and walk-in OPD desk with zero duplicate token guarantee.',
    assigneeRole: 'Project Owner & Lead Architect',
    stories: [
      {
        summary: 'Online Outpatient Token Booking with Concurrency Safeguard',
        description: 'Atomic token number generation with compound unique indexes to eliminate duplicate tokens.',
        tasks: ['Create booking schema', 'Add MongoDB unique index on (schedule_id, date, token_number)', 'Atomic $inc token counter']
      },
      {
        summary: 'Walk-In Reception Desk Token Issuance',
        description: 'Immediate on-spot token generation for walk-ins directly entering CHECKED_IN state.',
        tasks: ['Build Receptionist booking desk UI', 'Implement instant check-in API route']
      }
    ]
  },
  {
    key: 'EPIC-4',
    summary: 'Epic 4: Server-Authoritative Live Queue Engine & Doctor Console',
    description: 'Live queue session management and doctor consultation room calling actions.',
    assigneeRole: 'Project Owner & Lead Architect',
    stories: [
      {
        summary: 'Doctor Consultation Room Portal',
        description: 'Console for doctors to Call Next, Start Consultation, Complete, Hold, or Mark Absent.',
        tasks: ['Implement queue state transition API', 'Build Doctor Console UI with keyboard shortcuts']
      },
      {
        summary: 'Patient Self Check-In Mechanism',
        description: 'Allow patient to check in upon arrival at hospital before deadline to secure token.',
        tasks: ['Create check-in verification API', 'Build check-in QR / confirmation button on patient UI']
      }
    ]
  },
  {
    key: 'EPIC-5',
    summary: 'Epic 5: Automatic Token Expiry, Grace Period & Queue Advancement Worker',
    description: 'Server-side background worker with crash recovery to expire overdue tokens and advance queue.',
    assigneeRole: 'Project Owner & Lead Architect',
    stories: [
      {
        summary: 'Background Asyncio Expiry Engine',
        description: 'Runs every 30s to expire BOOKED tokens past grace deadline and advance active queue.',
        tasks: ['Build asyncio worker loop', 'Implement atomic status transition BOOKED -> EXPIRED', 'Add startup crash recovery']
      },
      {
        summary: 'Audit Logging for Queue State & Expiry Events',
        description: 'Track all automated expiry and manual overrides in MongoDB audit_logs.',
        tasks: ['Create audit_log repository', 'Record previous/new state, actor, and timestamp']
      }
    ]
  },
  {
    key: 'EPIC-6',
    summary: 'Epic 6: Real-Time Event Streaming & Digital Signage (Waiting Hall TV Mode)',
    description: 'WebSocket broadcasts and full-screen waiting hall display with audio chimes.',
    assigneeRole: 'Frontend Lead & UI/UX Engineer',
    stories: [
      {
        summary: 'WebSocket Queue Event Hub',
        description: 'Broadcast TOKEN_CALLED, TOKEN_COMPLETED, TOKEN_EXPIRED events in real-time.',
        tasks: ['Implement FastAPI WebSocket manager', 'Build reconnecting WebSocket hook in React']
      },
      {
        summary: 'Waiting Hall Digital Signage TV Mode',
        description: 'High-contrast large screen display showing current token, room #, and audible chime alert.',
        tasks: ['Create TV Display Mode view', 'Integrate Web Audio chime synthesizer on token call']
      }
    ]
  },
  {
    key: 'EPIC-7',
    summary: 'Epic 7: AI/ML Waiting-Time Prediction Engine',
    description: 'Heuristic baseline waiting time calculator and scikit-learn regression model with fallback.',
    assigneeRole: 'AI/ML & QA Automation Lead',
    stories: [
      {
        summary: 'Transparent Baseline Estimation Service',
        description: 'Calculate dynamic wait time = (tokens ahead) * (rolling avg duration) + (doctor delay).',
        tasks: ['Implement dynamic formula in Python', 'Expose /prediction/wait-time endpoint']
      },
      {
        summary: 'scikit-learn Regression Pipeline',
        description: 'Train regression model on historical consultation features with transparent heuristic fallback.',
        tasks: ['Prepare feature extraction', 'Train regression model', 'Implement fallback logic when records < 50']
      }
    ]
  },
  {
    key: 'EPIC-8',
    summary: 'Epic 8: Emergency Bed Availability Live Tracker',
    description: 'Real-time dashboard for ICU, Emergency, Oxygen, and General Ward bed occupancy.',
    assigneeRole: 'AI/ML & QA Automation Lead',
    stories: [
      {
        summary: 'Emergency Bed Tracking Dashboard',
        description: 'Live occupancy tracking across critical hospital wards with color-coded alerts.',
        tasks: ['Create bed_status schema & API', 'Build live bed occupancy card dashboard']
      }
    ]
  },
  {
    key: 'EPIC-9',
    summary: 'Epic 9: Multi-Channel Patient Notification & Alert Dispatcher',
    description: 'Booking confirmations, approaching turn alerts, and grace period countdown warnings.',
    assigneeRole: 'Backend & API Specialist',
    stories: [
      {
        summary: 'Automated Queue Turn & Expiry Notifications',
        description: 'Send alerts when 2 tokens away and 5 minutes before auto-expiry.',
        tasks: ['Build notification service interface', 'Implement simulated console logger and webhook dispatcher']
      }
    ]
  },
  {
    key: 'EPIC-10',
    summary: 'Epic 10: System Auditing, Analytics Dashboard & Deployment Readiness',
    description: 'OPD queue analytics, automated pytest/Vitest suites, Docker Compose, and documentation.',
    assigneeRole: 'AI/ML & QA Automation Lead',
    stories: [
      {
        summary: 'Queue Performance Analytics Dashboard',
        description: 'Recharts visualizations of patient throughput, token completion, and doctor turnaround times.',
        tasks: ['Create analytics aggregation queries', 'Build Recharts dashboard in React']
      },
      {
        summary: 'Comprehensive Automated Test Suite',
        description: 'Backend concurrent booking tests, deadline auto-expiry boundary tests, and Vitest component tests.',
        tasks: ['Write pytest concurrency tests', 'Write Vitest token card tests', 'Document deployment steps']
      }
    ]
  }
];

function getAuthHeader() {
  const token = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64');
  return `Basic ${token}`;
}

async function jiraFetch(endpoint, options = {}) {
  const url = `${JIRA_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': getAuthHeader(),
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    data = { raw: text };
  }

  return { status: response.status, ok: response.ok, data };
}

async function main() {
  console.log('=== Jira Automation for Logic Legends ===\n');

  if (!JIRA_BASE_URL || !JIRA_API_TOKEN) {
    console.log('STATUS: Credentials required.');
    console.log('Please provide your Jira Cloud site URL and API Token:');
    console.log('  1. Jira Base URL (e.g., https://your-workspace.atlassian.net)');
    console.log('  2. Project Owner Email: rohinthk2006@gmail.com');
    console.log('  3. Atlassian API Token from https://id.atlassian.com/manage-profile/security/api-tokens\n');
    return;
  }

  // 1. Inspect user
  console.log(`1. Inspecting current user on ${JIRA_BASE_URL}...`);
  const myself = await jiraFetch('/rest/api/3/myself');
  if (!myself.ok) {
    console.error(`Authentication failed (HTTP ${myself.status}):`, myself.data);
    return;
  }
  console.log(`   Logged in as: ${myself.data.displayName} (${myself.data.emailAddress || JIRA_EMAIL})`);
  console.log(`   Account ID: ${myself.data.accountId}`);

  // 2. Check existing projects
  console.log('\n2. Inspecting existing projects...');
  const projectsRes = await jiraFetch('/rest/api/3/project');
  if (!projectsRes.ok) {
    console.error(`Failed to list projects (HTTP ${projectsRes.status}):`, projectsRes.data);
    return;
  }

  const projects = projectsRes.data;
  const existingLogic = projects.find(p => p.name.toLowerCase() === 'logic');
  const existingLegends = projects.find(p => p.name.toLowerCase() === 'logic legends' || p.key === 'LLOP');

  if (existingLogic) {
    console.log(`   Found existing project: "${existingLogic.name}" (Key: ${existingLogic.key}) - Preserving as requested.`);
  }

  let targetProject = existingLegends;
  if (existingLegends) {
    console.log(`   Project "Logic Legends" already exists! (Key: ${existingLegends.key}, ID: ${existingLegends.id})`);
  } else {
    console.log('   "Logic Legends" does not exist yet. Creating new project...');
    const createProjectPayload = {
      key: 'LLOP',
      name: 'Logic Legends',
      projectTypeKey: 'software',
      projectTemplateKey: 'com.pyxis.greenhopper.jira:gh-simplified-scrum-classic',
      description: 'Hospital OP Live Tracker — AI-Powered Multi-Hospital Outpatient Queue, Waiting-Time Prediction and Emergency Bed Availability System',
      leadAccountId: myself.data.accountId,
      assigneeType: 'PROJECT_LEAD'
    };

    const createRes = await jiraFetch('/rest/api/3/project', {
      method: 'POST',
      body: JSON.stringify(createProjectPayload)
    });

    if (createRes.ok) {
      targetProject = createRes.data;
      console.log(`   Successfully created project "Logic Legends" (Key: ${targetProject.key}, ID: ${targetProject.id})`);
    } else {
      console.warn(`   Direct project creation returned HTTP ${createRes.status}:`, createRes.data);
    }
  }

  console.log('\n3. Teammates to invite / assign:');
  for (const member of TEAM_MEMBERS) {
    console.log(`   - ${member.name} (${member.email}) [Role: ${member.role}]`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TEAM_MEMBERS, EPICS };
