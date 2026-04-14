import { Issue } from "./types";

// In-memory cache
let cachedIssues: Issue[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetch issues from the database via API endpoint.
 * Uses in-memory caching to avoid repeated API calls.
 */
export async function getIssues(): Promise<Issue[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedIssues && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return cachedIssues;
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/issues`, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const issues = await response.json();
    
    // Update cache
    cachedIssues = issues;
    cacheTimestamp = now;
    
    return issues;
  } catch (error) {
    console.error("Failed to fetch issues from API:", error);
    
    // Return cached data if available, even if stale
    if (cachedIssues) {
      console.warn("Using stale cached issues due to API failure");
      return cachedIssues;
    }
    
    // Fallback to empty array if no cache available
    return [];
  }
}

// Legacy export for backwards compatibility - will be deprecated
// Components should migrate to using getIssues() instead
export const ISSUES: Issue[] = [
  {
    rank: 1, slug: "anxiety-depression", icon: "😰", severity: "critical",
    title: "Anxiety & Depression in School-Aged Children",
    anchorStat: "13.9% of children aged 4–17 have a mental disorder; anxiety is the most common",
    shortDesc: "Anxiety and depression are the leading mental health challenges in Australian schools, affecting hundreds of thousands of children and disrupting learning at its foundations.",
    definition: "Anxiety disorders include generalised anxiety, social anxiety, separation anxiety and phobias. Major depressive disorder involves persistent sadness, withdrawal, and loss of motivation. Both profoundly impair a child's ability to learn, form relationships, and develop.",
    australianData: "The Young Minds Matter national survey (2013–14) found 13.9% of children aged 4–17 had a mental disorder in the past 12 months, with anxiety disorders the most prevalent. AIHW corroborates this, and the Youth Self-Harm Atlas separately maps depression and anxiety disorders among 12–17 year olds at the PHN and SA3 level, showing significant regional variation across Australia.",
    mechanisms: "Anxiety activates the brain's threat-detection systems, crowding out the prefrontal cortex activity required for concentration, memory encoding, and reasoning. A child in chronic anxiety cannot easily absorb new information, retain lessons, or participate in classroom discussion. Depression compounds this through fatigue, anhedonia, and social withdrawal.",
    impacts: [
      { title: "Attendance", text: "Anxiety is the primary driver of school refusal — children avoid the environments that trigger their distress." },
      { title: "Working Memory", text: "Worry consumes cognitive resources needed for learning, reducing effective working memory capacity." },
      { title: "Social Development", text: "Withdrawal from peers stunts social skills and creates loneliness feedback loops." },
      { title: "Academic Outcomes", text: "Untreated anxiety correlates with lower NAPLAN scores and reduced Year 12 completion rates." },
    ],
    groups: ["Aboriginal & Torres Strait Islander youth", "Girls aged 12–17", "Outer regional & remote students", "Students with learning difficulties", "LGBTQ+ young people"],
    sources: ["Young Minds Matter National Survey (2013–14)", "AIHW Child & Youth Mental Health", "AIHW Youth Self-Harm Atlas — depression/anxiety risk factor layer"],
  },
  {
    rank: 2, slug: "self-harm-suicidality", icon: "🆘", severity: "critical",
    title: "Self-Harm & Suicidality",
    anchorStat: "AIHW Youth Self-Harm Atlas maps regional estimates at PHN and SA3 level nationally",
    shortDesc: "Youth self-harm and suicidal ideation are among the most serious indicators in Australian schools. Regional disparities are stark, with remote and Indigenous communities most at risk.",
    definition: "Self-harm refers to deliberate injury to one's body, often as a coping mechanism for emotional pain. Suicidality encompasses suicidal ideation, plans, and attempts. Both are medical emergencies and significant signals of underlying mental health crisis.",
    australianData: "The AIHW Youth Self-Harm Atlas provides regional estimates of youth self-harm and suicidality at PHN, SA4, and SA3 levels using percentile banding. Northern Territory and several Western Australian regional areas consistently appear in the highest percentile bands. The Atlas also maps the co-occurrence of self-harm with depression and anxiety disorders across the same regions.",
    mechanisms: "Self-harm often functions as emotional regulation in the absence of other coping skills. Suicidality emerges from a combination of psychological pain, hopelessness, and perceived burdensomeness. School environments can be protective (belonging, trusted adults) or risk-amplifying (bullying, shame, academic failure).",
    impacts: [
      { title: "Attendance & Withdrawal", text: "Episodes often precipitate prolonged absence and social withdrawal from school community." },
      { title: "Classroom Safety", text: "Schools must balance duty of care, disclosure requirements, and non-stigmatising response." },
      { title: "Peer Impact", text: "Disclosure to peers can create anxiety and secondary trauma in classmates." },
      { title: "Long-term Trajectory", text: "Early self-harm is a predictor of adult mental health burden without appropriate intervention." },
    ],
    groups: ["Remote and very remote youth", "Aboriginal & Torres Strait Islander youth", "Young people in out-of-home care", "LGBTQ+ youth", "Teens with co-occurring depression/anxiety"],
    sources: ["AIHW Youth Self-Harm Atlas — regional PHN/SA3/SA4 data", "AIHW Suicide & Self-Harm Monitoring", "National Suicide Prevention Adviser reports"],
  },
  {
    rank: 3, slug: "distress-loneliness", icon: "💔", severity: "critical",
    title: "Psychological Distress & Loneliness in Teens",
    anchorStat: "1 in 5 Australian youth report high psychological distress; 1 in 5 feel lonely most or all of the time",
    shortDesc: "Loneliness and psychological distress have emerged as interconnected epidemics among Australian teenagers, accelerated by the COVID-19 pandemic and social media disruption.",
    definition: "Psychological distress refers to emotional suffering characterised by anxiety and depression symptoms. Loneliness is the subjective feeling of disconnection from others — distinct from social isolation. Both are powerful predictors of long-term mental health outcomes.",
    australianData: "Mission Australia Youth Survey 2024 found one in five young Australians reported high or very high levels of psychological distress, and one in five felt lonely most or all of the time. Barriers to personal goals included mental health challenges and motivation issues, with discrimination and inequality identified as major societal concerns by young Australians.",
    mechanisms: "Loneliness activates the same neural pathways as physical pain. Persistent loneliness increases cortisol, impairs sleep, and reduces immune function. In the school context, a lonely student is less likely to seek help from teachers, less likely to participate in class, and more likely to disengage from school entirely.",
    impacts: [
      { title: "Help-Seeking", text: "Lonely students are significantly less likely to approach teachers or school counsellors when struggling." },
      { title: "Classroom Participation", text: "Social anxiety and distress dramatically reduce verbal participation and collaborative learning." },
      { title: "Retention", text: "Loneliness is a direct predictor of school dropout, especially in secondary school." },
      { title: "Physical Health", text: "Chronic loneliness is linked to poor sleep, poor diet, and reduced physical activity." },
    ],
    groups: ["Rural and remote youth", "Recently migrated students", "Students with disabilities", "Year 9–10 students (peak loneliness years)", "LGBTQ+ youth"],
    sources: ["Mission Australia Youth Survey 2024", "AIHW Children's Mental Health Overview", "Productivity Commission RoGS 2026 — engagement indicators"],
  },
  {
    rank: 4, slug: "bullying", icon: "👊", severity: "critical",
    title: "Bullying at School",
    anchorStat: "46,000+ bullying incidents recorded in Queensland schools in 2023 alone",
    shortDesc: "School bullying remains pervasive and underreported across Australia. The absence of consistent national data collection is itself a governance failure that this site documents explicitly.",
    definition: "Bullying is repeated, intentional aggressive behaviour directed at an individual where there is a perceived power imbalance. It includes physical, verbal, relational, and online forms. Repetition and power differential are defining features — a one-off conflict between equals is not bullying.",
    australianData: "Australia lacks a single consistent national bullying prevalence rate, explicitly noted in the Department of Education's anti-bullying rapid review consultation paper, due to inconsistent data collection across jurisdictions. The Queensland Auditor-General's Report 6 (2024–25) recorded over 46,000 incidents in Queensland state schools in 2023. This national data gap is disclosed on this site as a governance limitation.",
    mechanisms: "Bullying causes chronic stress activation. Victims experience hypervigilance, fear of school, and shame. These directly impair learning through attention deficit, emotional dysregulation, and avoidance behaviours. Witnesses also experience elevated stress. School climate deteriorates when bullying goes unaddressed.",
    impacts: [
      { title: "Attendance", text: "Bullying victims frequently become school avoiders. Chronic absence follows unresolved bullying situations." },
      { title: "Mental Health", text: "Victimisation significantly increases risk of depression, anxiety, and suicidal ideation." },
      { title: "Academic Performance", text: "The cognitive load of threat-vigilance directly displaces learning-directed attention." },
      { title: "Social Trust", text: "Peer relationships become sources of threat rather than support, belonging, and development." },
    ],
    groups: ["LGBTQ+ students (elevated target rate)", "Students with disabilities", "Aboriginal & Torres Strait Islander students", "Students of non-English-speaking backgrounds", "Students with visible difference"],
    sources: ["Queensland Auditor-General Report 6 (2024–25)", "AIHW Australia's Children: In Brief", "Department of Education Anti-Bullying Rapid Review Consultation Paper"],
  },
  {
    rank: 5, slug: "cyberbullying", icon: "📱", severity: "critical",
    title: "Cyberbullying",
    anchorStat: "53% of 10–17 year olds experienced cyberbullying; 38% in the past 12 months",
    shortDesc: "Cyberbullying has erased the boundary between school and home. For many children, the torment follows them to bed. Australia's eSafety Commissioner leads the world in documenting this crisis.",
    definition: "Cyberbullying is online bullying using digital technology — including social media, messaging platforms, gaming environments, and email. It includes harassment, spreading rumours, exclusion, sharing embarrassing images, and impersonation. Unlike traditional bullying, it occurs 24/7 and can reach a global audience.",
    australianData: "The eSafety Commissioner's research found 53% of 10–17 year olds had experienced cyberbullying at some point, and 38% in the past 12 months. Near-universal platform use among Australian teenagers means almost all children are at exposure risk. Harmful content including hate, violence, and pro-self-harm material is widely encountered.",
    mechanisms: "The always-on nature of cyberbullying means there is no safe refuge — not home, not the weekend, not school holidays. Constant threat monitoring, social status anxiety, and the viral amplification of humiliation create acute and chronic stress. Sleep disruption from late-night phone checking compounds the mental health damage significantly.",
    impacts: [
      { title: "Sleep & Fatigue", text: "Night-time notification checking disrupts sleep, compounding mental health and attention problems." },
      { title: "School Avoidance", text: "When cyberbullying involves classmates, schools become unsafe — triggering refusal and absence." },
      { title: "Emotional Regulation", text: "Constant digital threat monitoring increases emotional reactivity and reduces frustration tolerance." },
      { title: "Self-Esteem", text: "Public humiliation at scale erodes self-worth during developmentally critical years." },
    ],
    groups: ["Girls aged 10–17 (higher prevalence)", "Students on image-based platforms", "LGBTQ+ youth (higher severity)", "High-social-media-use teens", "Students already experiencing social anxiety"],
    sources: ["eSafety Commissioner — Online Experiences of Children in Australia", "eSafety Commissioner — Cyberbullying Snapshot", "Black Dog Institute Teens & Screens 2024"],
  },
  {
    rank: 6, slug: "online-hate", icon: "🌐", severity: "high",
    title: "Online Hate, Harassment & Harmful Content",
    anchorStat: "eSafety documents widespread exposure to hate, harmful content, and online harassment among Australian children",
    shortDesc: "Australian children's online environments are saturated with hate, extremism, and harmful content. Exposure is not rare — it is routine. Schools cannot control the digital world children inhabit.",
    definition: "Online hate includes content targeting individuals or groups based on race, religion, gender, sexuality, or disability. Harmful content includes graphic violence, pro-eating-disorder material, self-harm encouragement, and extremist ideology. Harassment is targeted, repeated digital abuse.",
    australianData: "The eSafety Commissioner's research documents that harmful content is widely encountered online by Australian children, including racist, violent, and hateful material. Children from marginalised communities encounter identity-based hate at higher rates. The same platforms where friendships form are also spaces where hate consistently thrives.",
    mechanisms: "Repeated exposure to dehumanising content normalises aggression and prejudice. For targeted children, online hate functions like bullying — creating shame, hypervigilance, and identity-threat stress. Pro-self-harm communities can escalate vulnerable young people toward crisis. Algorithmic amplification means exposure is not accidental or random.",
    impacts: [
      { title: "Identity & Belonging", text: "Racialised hate undermines cultural identity, sense of belonging, and school engagement." },
      { title: "Radicalisation Risk", text: "Extremist content can fill emotional voids in disconnected or bullied teenagers." },
      { title: "Mental Health", text: "Chronic exposure to hate and violence content correlates with anxiety and depression." },
      { title: "Social Trust", text: "Online harassment erodes trust in both digital and real-world social environments." },
    ],
    groups: ["Students of racial and ethnic minorities", "LGBTQ+ youth", "Students with religious visibility", "Teens experiencing social rejection", "Boys on gaming platforms"],
    sources: ["eSafety Commissioner — Online Experiences of Children in Australia", "eSafety Commissioner — Harmful Content Research", "Mission Australia Youth Survey 2024"],
  },
  {
    rank: 7, slug: "school-belonging", icon: "🏫", severity: "high",
    title: "School Belonging & Connectedness",
    anchorStat: "NSW CESE evidence links belonging directly to lower bullying and better academic outcomes",
    shortDesc: "A child who doesn't feel they belong at school is unlikely to succeed in it. Belonging is not a soft goal — it is a measurable, evidence-based predictor of wellbeing, learning, and retention.",
    definition: "School belonging refers to a student's subjective sense of being accepted, valued, and included by teachers and peers. Key dimensions include having supportive adults, positive peer relationships, feeling safe, and experiencing inclusion. A student can be physically present but psychologically absent.",
    australianData: "The Productivity Commission's RoGS 2026 describes how jurisdictions collect belonging data through student surveys. NSW CESE research documents that strong belonging is linked to lower bullying victimisation and better academic engagement. Belonging scores have declined nationally in the post-COVID period.",
    mechanisms: "Belonging is a fundamental human need. In the school context, it activates intrinsic motivation and reduces threat-based learning blockers. When a student feels they belong, they take intellectual risks, ask for help, and persist through challenges. Without belonging, school becomes a source of shame rather than a place of growth.",
    impacts: [
      { title: "Motivation", text: "Belonging is the strongest non-academic predictor of intrinsic learning motivation." },
      { title: "Help-Seeking", text: "Students with high belonging are significantly more likely to seek help from teachers." },
      { title: "Bullying", text: "Strong belonging culture is consistently associated with substantially lower bullying prevalence." },
      { title: "Retention", text: "Belonging deficits are a leading predictor of early school leaving." },
    ],
    groups: ["Students transitioning to secondary school", "Recently arrived migrant students", "LGBTQ+ students", "Students in low-SES communities", "Students with disabilities"],
    sources: ["Productivity Commission RoGS 2026 — school education", "NSW CESE Belonging Research", "Mission Australia Youth Survey 2024"],
  },
  {
    rank: 8, slug: "attendance-disengagement", icon: "📉", severity: "high",
    title: "Attendance Decline & Disengagement",
    anchorStat: "57% average attendance in very remote schools vs 93% in major cities — RoGS 2026",
    shortDesc: "Australia's school attendance crisis is starkest in remote communities, but is worsening nationally. Every missed day compounds learning loss and disconnection in ways that are hard to reverse.",
    definition: "Attendance is the proportion of possible school days attended. Chronic absenteeism typically means missing 10% or more of school days. Disengagement is broader — a student can be present but cognitively, emotionally, or behaviourally disengaged. Both are measured in the Report on Government Services.",
    australianData: "RoGS 2026 reports national attendance by remoteness category, showing a steep gradient: major cities ~93%, inner regional ~90%, outer regional ~87%, remote ~80%, and very remote ~57%. Aboriginal and Torres Strait Islander students face compounded challenges. Secondary school attendance declines progressively through Year 10.",
    mechanisms: "Non-attendance creates compound learning loss — skills build on each other, and gaps widen exponentially over time. Disengagement signals that the school environment is not meeting the student's psychological needs. Mental health conditions including anxiety and depression are among the most common causes of medically-justified absence.",
    impacts: [
      { title: "Learning Loss", text: "Each missed day means lost instruction, missed transitions, and widened skill gaps." },
      { title: "Social Connection", text: "Absence disrupts peer relationship formation — a critical developmental need in school years." },
      { title: "Long-term Outcomes", text: "Chronic absence in primary school is a predictor of Year 12 non-completion." },
      { title: "Equity", text: "Remote, Indigenous, and low-SES students face compounding structural barriers to attendance." },
    ],
    groups: ["Remote and very remote students", "Aboriginal & Torres Strait Islander students", "Students experiencing housing instability", "Students with untreated mental health conditions", "Students from low-SES families"],
    sources: ["Productivity Commission RoGS 2026 — school education", "AIHW Australia's Children", "Australian Curriculum, Assessment and Reporting Authority"],
  },
  {
    rank: 9, slug: "school-refusal", icon: "🚪", severity: "high",
    title: "School Refusal & Emotionally Based Absence",
    anchorStat: "Post-pandemic spike in school refusal documented nationally — Parliamentary Library 2022–23",
    shortDesc: "School refusal is not defiance. It is fear. Distinguishing emotionally-based school avoidance from truancy is critical to getting the response right — and many schools still don't make this distinction.",
    definition: "School refusal (emotionally-based school avoidance) refers to severe difficulty attending school associated with emotional distress — particularly anxiety, depression, and somatic symptoms. It is explicitly distinguished from truancy (wilful absence) in academic and policy literature. The child often wants to attend but is overwhelmed by distress.",
    australianData: "The Australian Parliamentary Library Research Paper (2022–23) defines school refusal, notes the post-pandemic surge, and highlights the distinction from truancy. School refusal affects an estimated 1–5% of students at any given time and is most common at key transition points. Anxiety is the most common underlying driver nationally.",
    mechanisms: "School environments contain multiple anxiety triggers: performance assessment, social evaluation, unpredictability, and authority relationships. When anxiety is severe enough, the avoidance response becomes overwhelming. Morning escalation into panic attacks and somatic symptoms are common presentations. The longer avoidance continues, the harder return becomes.",
    impacts: [
      { title: "Learning Loss", text: "Extended school refusal episodes cause severe curriculum gaps and declining academic confidence." },
      { title: "Family Stress", text: "School refusal places intense pressure on parents — work disruption, guilt, and helplessness." },
      { title: "Social Skills", text: "Missed peer interaction stunts social development during critical adolescent years." },
      { title: "Misdiagnosis", text: "Children labelled 'truants' when experiencing refusal receive punishment rather than the support they need." },
    ],
    groups: ["Students with anxiety disorders", "Students with ASD or sensory sensitivities", "Year 7 transition students", "Students who have experienced bullying", "Children of anxious parents"],
    sources: ["Parliamentary Library Research Paper 2022–23 — School Refusal", "Young Minds Matter anxiety prevalence data", "Australian Institute of Family Studies"],
  },
  {
    rank: 10, slug: "sleep-deprivation", icon: "💤", severity: "high",
    title: "Sleep Deprivation & Fatigue",
    anchorStat: "25% of 12–13 yr olds and 50% of 16–17 yr olds miss sleep guidelines on school nights",
    shortDesc: "Sleep deprivation is quietly undermining the cognitive capacity of Australian teenagers. A tired student is physically present in the classroom but neurologically compromised.",
    definition: "Sleep guidelines recommend 9–11 hours for children aged 6–12 and 8–10 hours for teenagers 13–17. AIHW uses self-reported and device-based data. 'School night' sleep is the critical measure, given the direct link between insufficient sleep and next-day cognitive performance.",
    australianData: "AIHW reports that one-quarter of 12–13 year olds and approximately half of 16–17 year olds do not meet recommended sleep guidelines on school nights. This is strongly linked to smartphone and screen use. Among older teens, the prevalence is almost a majority — a structural problem, not an individual failing.",
    mechanisms: "Sleep is when the brain consolidates memory from the school day. REM sleep processes emotional experiences. Sleep deprivation impairs the prefrontal cortex (executive function, impulse control, decision-making) while heightening amygdala emotional reactivity. A sleep-deprived student is more irritable, less able to concentrate, and more likely to experience depressive symptoms.",
    impacts: [
      { title: "Memory Consolidation", text: "Sleep deprivation prevents the consolidation needed to retain lessons learned during the school day." },
      { title: "Emotional Regulation", text: "Tired students are more irritable, reactive, and prone to conflict with peers and teachers." },
      { title: "Mental Health", text: "Chronic sleep loss is bidirectionally linked to anxiety and depression in adolescents." },
      { title: "Physical Health", text: "Insufficient sleep impacts immune function, weight regulation, and physical development." },
    ],
    groups: ["Teenagers aged 14–17 (highest deficit)", "Students on social media platforms", "Students with anxiety or depression", "Students in early-start schools", "Students with heavy gaming habits"],
    sources: ["AIHW Sleep Problems as a Risk Factor", "Black Dog Institute Teens & Screens 2024", "National Sleep Foundation Age-Based Guidelines"],
  },
  {
    rank: 11, slug: "screens-social-media", icon: "📲", severity: "high",
    title: "Screens, Social Media & Mental Health Load",
    anchorStat: "Black Dog Institute 2024: Australian adolescent screen use is creating measurable mental health burden",
    shortDesc: "Australian research now documents the link between high social media use and adolescent mental health deterioration. The evidence has moved past debate — but the solutions remain actively contested.",
    definition: "Screen-related mental health load refers to the psychological burden created by excessive or problematic use of smartphones, social media, gaming, and streaming. This includes social comparison, fear of missing out, cyberbullying exposure, sleep disruption, and displacement of face-to-face socialisation.",
    australianData: "The Black Dog Institute's 2024 report using Australian adolescent data documents associations between high social media use and elevated rates of depression, anxiety, and poor self-image. The eSafety Commissioner reports near-universal platform use among teenagers, with high exposure to harmful content creating a compounding mental health load.",
    mechanisms: "Social media platforms are designed to maximise engagement using variable reward systems that exploit the dopamine reward pathway. Adolescent brains — whose reward circuits are more active and executive function still developing — are particularly susceptible. Social comparison operates constantly; status signals (likes, followers) create real anxiety. Algorithmic personalisation accelerates exposure to harmful content.",
    impacts: [
      { title: "Social Comparison", text: "Constant comparison to curated peer images is a leading driver of body dissatisfaction and low self-worth." },
      { title: "Attention Span", text: "Short-form content consumption makes sustained classroom learning progressively harder." },
      { title: "Sleep Displacement", text: "Late-night scrolling is the primary driver of adolescent sleep deficit in Australia." },
      { title: "Relationship Quality", text: "Time online displaces the face-to-face interaction needed for social skill development." },
    ],
    groups: ["Girls aged 12–17 (highest social media harm)", "Teens with pre-existing anxiety", "Students with ADHD", "Students with limited offline social support", "Boys in gaming-heavy environments"],
    sources: ["Black Dog Institute Teens & Screens Report 2024", "eSafety Commissioner Online Experiences Research", "AIHW Adolescent Health Indicators"],
  },
  {
    rank: 12, slug: "academic-stress", icon: "📚", severity: "high",
    title: "Stress & Academic Workload Pressure",
    anchorStat: "Australian PISA 2022 documents student exposure to stress and performance pressure as education risk factors",
    shortDesc: "Academic pressure is developmentally appropriate in small doses. In Australian secondary schools — particularly Years 11–12 — it has become a crisis of chronic, sustained stress.",
    definition: "Academic stress refers to the psychological pressure created by perceived demands exceeding coping resources in the school context. Key drivers include examinations, grades, ATAR expectations, parental pressure, peer competition, and perceived consequences of failure.",
    australianData: "PISA 2022 data, reported by ACER for Australia, includes student experience constructs such as stress resistance and test anxiety. Mission Australia 2024 identifies mental health challenges as a barrier to achieving personal goals for one in five young Australians across all states and territories.",
    mechanisms: "Chronic academic stress activates the hypothalamic-pituitary-adrenal (HPA) axis, releasing cortisol. Short-term, this can enhance performance. Chronically, it damages hippocampal memory, impairs immune function, disrupts sleep, and creates a vicious cycle where stress impairs performance, which in turn increases stress.",
    impacts: [
      { title: "Physical Health", text: "Chronic stress causes headaches, stomach problems, and weakened immunity in students." },
      { title: "Sleep Quality", text: "Academic rumination — worrying about school at night — is a primary driver of teen insomnia." },
      { title: "Relationship Quality", text: "Overwhelmed students withdraw from family and peer connection, compounding isolation." },
      { title: "Learning Paradox", text: "Severe stress actually impairs the very cognitive functions needed to study effectively." },
    ],
    groups: ["Year 11–12 students under ATAR pressure", "Students in selective/high-achieving schools", "First-generation tertiary aspiration students", "Students with perfectionist traits", "Children of high-expectation parents"],
    sources: ["ACER PISA 2022 Australia Volume II — Student Wellbeing", "Mission Australia Youth Survey 2024", "Australian Association of Psychologists — exam stress research"],
  },
  {
    rank: 13, slug: "racism-discrimination", icon: "🤜", severity: "high",
    title: "Racism, Discrimination & Exclusion",
    anchorStat: "Mission Australia Youth Survey 2024: discrimination and inequality rated a top societal concern by Australian youth",
    shortDesc: "Racism in Australian schools is not just a social justice issue — it is a documented mental health and educational attainment crisis. Children who experience discrimination learn less and suffer more.",
    definition: "Racism and discrimination in schools includes direct incidents (slurs, exclusion, physical aggression based on race), structural racism (curriculum that excludes non-Western cultures), and microaggressions (everyday dismissals and othering). All forms cause documented psychological harm.",
    australianData: "Mission Australia Youth Survey 2024 identifies discrimination and inequality as a top-ranked societal concern among young Australians. eSafety Commissioner data documents that online hate — frequently racialised — is encountered by a significant proportion of young people. Aboriginal students, students from refugee backgrounds, and Muslim students are among the most frequently targeted groups.",
    mechanisms: "Repeated exposure to discrimination activates a chronic stress response. Identity-based attacks threaten the self-concept at a developmentally critical time. Racial discrimination in schools has been shown to reduce academic self-efficacy, reduce help-seeking behaviour, and increase disengagement and absence.",
    impacts: [
      { title: "Academic Identity", text: "Discrimination directly reduces students' belief in their own academic capability and belonging." },
      { title: "Mental Health", text: "Racial trauma is associated with elevated anxiety, depression, and PTSD symptoms in young people." },
      { title: "Attendance", text: "Students who experience discrimination regularly avoid school to avoid continued exposure." },
      { title: "Institutional Trust", text: "Schools that tolerate discrimination lose the trust of entire family communities, not just individual students." },
    ],
    groups: ["Aboriginal & Torres Strait Islander students", "Students of African background", "Muslim students", "Students from refugee and asylum seeker families", "East and South Asian students"],
    sources: ["Mission Australia Youth Survey 2024", "eSafety Commissioner Online Hate Research", "AIHW Social Determinants and Child Health"],
  },
  {
    rank: 14, slug: "motivation-disengagement", icon: "🎯", severity: "notable",
    title: "Motivation & Learning Disengagement",
    anchorStat: "RoGS 2026 defines cognitive engagement including motivation as a key schooling indicator, measured across jurisdictions",
    shortDesc: "Motivation is not a personal failing — it is the product of whether a student believes school is relevant, safe, and achievable. When schools lose student motivation, they lose the students.",
    definition: "Learning engagement encompasses cognitive (motivation), behavioural (attendance, participation), and emotional (belonging, interest) dimensions. The Productivity Commission's RoGS framework uses all three. Motivation refers to the drive to engage with learning — both intrinsic and extrinsic.",
    australianData: "RoGS 2026 defines engagement dimensions and notes that jurisdictions collect engagement data through student surveys. Mission Australia Youth Survey 2024 identifies motivation as a barrier to personal goals for many young Australians. Attendance data shows progressive secondary school disengagement, with Year 9–10 seeing the steepest national drops.",
    mechanisms: "Motivation requires perceived competence ('I can do this'), perceived value ('This matters'), and psychological safety ('I won't be humiliated if I try'). Wellbeing deficits undermine all three. Anxiety says 'you might fail'. Discrimination says 'this isn't for you'. Bullying makes classroom participation dangerous.",
    impacts: [
      { title: "Learning Depth", text: "Unmotivated students learn shallowly — retaining less, applying little, and progressing slowly." },
      { title: "Attendance", text: "Low motivation is a primary driver of voluntary disengagement and increasing absenteeism." },
      { title: "Teacher Relationships", text: "Disengaged students are harder to reach — creating frustration cycles in classrooms." },
      { title: "Future Aspiration", text: "Low school motivation correlates with lower post-school aspiration and workforce participation." },
    ],
    groups: ["Students in outer regional and remote areas", "Aboriginal & Torres Strait Islander students", "Boys in secondary school (engagement gap)", "Students who have experienced bullying", "Students with undiagnosed learning difficulties"],
    sources: ["Productivity Commission RoGS 2026 — School Education Engagement", "Mission Australia Youth Survey 2024", "ACER PISA 2022 — Motivation indicators"],
  },
  {
    rank: 15, slug: "reporting-gaps", icon: "⚠️", severity: "notable",
    title: "Safety & Wellbeing Incident Reporting Gaps",
    anchorStat: "Queensland Auditor-General Report 6 (2024–25): Australia's only state-level public accountability dataset on school safety incidents",
    shortDesc: "How schools record and report wellbeing incidents varies dramatically across jurisdictions. Queensland's audit exposes what happens when accountability is taken seriously — and what the silence elsewhere reveals.",
    definition: "Safety and wellbeing incidents encompass bullying, harassment, discrimination, physical assault, and self-harm episodes requiring school intervention. How consistently they are recorded determines whether patterns can be identified and addressed.",
    australianData: "The Queensland Auditor-General's Report 6 (2024–25) represents Australia's most comprehensive accountability snapshot on school safety incidents, recording over 46,000 events in Queensland state schools in 2023. Other jurisdictions have no equivalent public dataset, making national comparison impossible.",
    mechanisms: "Consistent incident reporting is a precondition for evidence-based safety interventions. Without data, patterns cannot be identified, resources cannot be targeted, and schools cannot be held accountable. The absence of national standards means an identical incident is handled and recorded very differently across Australia's eight jurisdictions.",
    impacts: [
      { title: "Accountability", text: "Without data, schools cannot be held accountable for student safety outcomes by governments or parents." },
      { title: "Resource Allocation", text: "Data gaps mean welfare resources cannot be effectively targeted to schools with the highest need." },
      { title: "Parent Trust", text: "Inconsistent reporting erodes parent confidence in school safety systems and transparency." },
      { title: "Policy Development", text: "National wellbeing policy cannot be evidence-based without consistent national incident data." },
    ],
    groups: ["Students in jurisdictions without public reporting", "Aboriginal & Torres Strait Islander students (underreported incidents)", "LGBTQ+ students", "Students in non-government schools", "Remote school students"],
    sources: ["Queensland Auditor-General Report 6 (2024–25) — Protecting Students from Bullying", "Department of Education Anti-Bullying Rapid Review Consultation Paper", "AIHW — Australia's Children Data Gaps Notes"],
  },
];
