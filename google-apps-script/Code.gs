/**
 * NALARVA BACKEND — Google Apps Script
 * Frontend: Next.js static export
 * Storage: Google Sheets + Google Drive
 *
 * SETUP PERTAMA:
 * 1. Jalankan setupNalarva() sekali dari Apps Script editor.
 * 2. Lihat Execution log untuk URL database, folder Drive, email admin, dan password sementara.
 * 3. Deploy sebagai Web app dan gunakan URL /exec pada NEXT_PUBLIC_APPS_SCRIPT_URL.
 */

const APP_NAME = 'NALARVA';
const SESSION_DAYS = 7;

const SCHEMA = {
  USERS: ['id','email','password_hash','salt','role','name','status','created_at','updated_at'],
  STUDENTS: ['id','user_id','student_no','level','grade','school','student_phone','birth_date','city','address','parent_name','parent_phone','parent_email','guardian_relation','program_id','status','joined_at'],
  TUTORS: ['id','user_id','tutor_no','specialization','phone','status','joined_at'],
  PROGRAMS: ['id','code','name','level','description','status','created_at'],
  CLASSES: ['id','program_id','code','name','tutor_user_id','capacity','status','start_date','end_date'],
  ENROLLMENTS: ['id','class_id','student_user_id','status','enrolled_at'],
  SCHEDULES: ['id','class_id','title','start_at','end_at','meeting_url','notes','status'],
  MATERIALS: ['id','class_id','title','type','drive_file_id','drive_url','description','published_at','status'],
  ASSIGNMENTS: ['id','class_id','title','description','due_at','drive_file_id','status','created_at'],
  SUBMISSIONS: ['id','assignment_id','student_user_id','drive_file_id','drive_url','submitted_at','score','feedback','status'],
  ATTENDANCE: ['id','schedule_id','student_user_id','status','checkin_at','notes'],
  QUESTIONS: ['id','program_id','subject','topic','question_type','question_text','option_a','option_b','option_c','option_d','option_e','correct_answer','explanation','difficulty','status'],
  EXAMS: ['id','program_id','code','title','duration_minutes','start_at','end_at','status','created_at'],
  EXAM_ITEMS: ['id','exam_id','question_id','order_no','points'],
  ATTEMPTS: ['id','exam_id','student_user_id','started_at','submitted_at','score','correct_count','wrong_count','status'],
  ANSWERS: ['id','attempt_id','question_id','answer','is_correct','points','answered_at'],
  RESULTS: ['id','student_user_id','exam_id','score','rank','percentile','analysis_json','published_at'],
  REGISTRATIONS: ['id','name','email','phone','level','school','status','source','created_at'],
  CONTACTS: ['id','name','phone','level','message','status','created_at'],
  SESSIONS: ['id','user_id','token_hash','created_at','expires_at','status'],
  AUDIT_LOG: ['id','user_id','action','entity','entity_id','detail','created_at'],
  PACKAGES: ['id','code','name','program_id','billing_period','price','class_sessions','tryout_quota','duration_days','description','status','created_at','updated_at'],
  ORDERS: ['id','invoice_no','registration_id','user_id','package_id','amount','payment_method','status','notes','due_at','created_at','paid_at','activated_at'],
  PAYMENTS: ['id','order_id','amount','method','reference','proof_file_id','proof_url','submitted_by','submitted_at','review_notes','status','confirmed_by','confirmed_at'],
  SUBSCRIPTIONS: ['id','user_id','package_id','order_id','program_id','start_at','end_at','status','source','created_at','updated_at'],
  SETTINGS: ['key','value','description','updated_at'],
  NOTIFICATIONS: ['id','user_id','email','type','title','message','link','channel','status','entity_key','created_at','read_at','sent_at'],
  CALENDAR_EVENTS: ['id','program_id','class_id','title','description','type','start_at','end_at','status','created_by','created_at'],
  MESSAGES: ['id','sender_user_id','recipient_user_id','class_id','subject','message','status','created_at','read_at'],
  CERTIFICATES: ['id','result_id','student_user_id','exam_id','cert_no','verification_code','status','issued_at'],
  GUARDIANS: ['id','guardian_user_id','student_user_id','relation','phone','status','created_at'],
  BACKUPS: ['id','file_id','file_name','file_url','mode','status','created_by','created_at']
};

function setupNalarva() {
  const props = PropertiesService.getScriptProperties();
  let ssId = props.getProperty('NALARVA_SPREADSHEET_ID');
  let ss;
  if (ssId) {
    ss = SpreadsheetApp.openById(ssId);
  } else {
    ss = SpreadsheetApp.create('NALARVA_DB');
    ssId = ss.getId();
    props.setProperty('NALARVA_SPREADSHEET_ID', ssId);
  }

  Object.keys(SCHEMA).forEach(name => ensureSheet_(ss, name, SCHEMA[name]));
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && Object.keys(SCHEMA).length > 0) ss.deleteSheet(defaultSheet);

  if (!props.getProperty('NALARVA_AUTH_PEPPER')) {
    props.setProperty('NALARVA_AUTH_PEPPER', Utilities.getUuid() + Utilities.getUuid());
  }

  let rootId = props.getProperty('NALARVA_DRIVE_ROOT_ID');
  let root;
  if (rootId) root = DriveApp.getFolderById(rootId);
  else {
    root = DriveApp.createFolder('NALARVA');
    rootId = root.getId();
    props.setProperty('NALARVA_DRIVE_ROOT_ID', rootId);
  }
  ['TKA SD','TKA SMP','TKA SMA','Materi','Tugas','Tryout','Upload Siswa','Dokumen Admin','Bukti Pembayaran','Backup Database'].forEach(n => ensureChildFolder_(root,n));

  seedPrograms_();
  seedPackages_();
  seedPaymentSettings_();
  ensureLegacySubscriptions_();
  ensureMaintenanceTriggers_();
  const admin = ensureInitialAdmin_();

  const result = {
    ok: true,
    spreadsheetUrl: ss.getUrl(),
    driveFolderUrl: root.getUrl(),
    adminEmail: admin.email,
    temporaryPassword: admin.temporaryPassword || '(akun admin sudah ada; password tidak diubah)'
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'health');
  if (action === 'health') return json_({ok:true,message:'NALARVA backend aktif',data:{version:'9.0-production-ready'}});
  return json_({ok:false,message:'Gunakan POST untuk endpoint Nalarva.'});
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const action = String(body.action || '');
    switch (action) {
      case 'health': return json_({ok:true,message:'NALARVA backend aktif'});
      case 'register': return handleRegister_(body);
      case 'contact': return handleContact_(body);
      case 'publicPackages': return handlePublicPackages_(body);
      case 'lookupInvoice': return handleLookupInvoice_(body);
      case 'submitPaymentProof': return handleSubmitPaymentProof_(body);
      case 'login': return handleLogin_(body);
      case 'me': return handleMe_(body);
      case 'logout': return handleLogout_(body);
      case 'changePassword': return handleChangePassword_(body);
      case 'adminOverview': return handleAdminOverview_(body);
      case 'tutorOverview': return handleTutorOverview_(body);
      case 'studentOverview': return handleStudentOverview_(body);
      case 'studentAccessStatus': return handleStudentAccessStatus_(body);
      case 'studentBilling': return handleStudentBilling_(body);
      case 'listNotifications': return handleListNotifications_(body);
      case 'notificationCount': return handleNotificationCount_(body);
      case 'markNotificationRead': return handleMarkNotificationRead_(body);
      case 'markAllNotificationsRead': return handleMarkAllNotificationsRead_(body);
      case 'listCalendarEvents': return handleListCalendarEvents_(body);
      case 'listMessages': return handleListMessages_(body);
      case 'messageRecipients': return handleMessageRecipients_(body);
      case 'sendMessage': return handleSendMessage_(body);
      case 'markMessageRead': return handleMarkMessageRead_(body);
      case 'studentProfile': return handleStudentProfile_(body);
      case 'updateStudentProfile': return handleUpdateStudentProfile_(body);
      case 'studentCertificates': return handleStudentCertificates_(body);
      case 'parentChildren': return handleParentChildren_(body);
      case 'parentOverview': return handleParentOverview_(body);
      case 'parentAttendance': return handleParentAttendance_(body);
      case 'parentProgressReport': return handleParentProgressReport_(body);
      case 'parentTranscript': return handleParentTranscript_(body);
      case 'globalSearch': return handleGlobalSearch_(body);

      // Read operations
      case 'listPrograms': return handleListPrograms_(body);
      case 'listClasses': return handleListClasses_(body);
      case 'listSchedules': return handleListSchedules_(body);
      case 'listMaterials': return handleListMaterials_(body);
      case 'listAssignments': return handleListAssignments_(body);
      case 'listExams': return handleListExams_(body);
      case 'listQuestions': return handleListQuestions_(body);
      case 'listResults': return handleListResults_(body);
      case 'getRanking': return handleRanking_(body);
      case 'listRegistrations': return handleListRegistrations_(body);
      case 'listClassStudents': return handleListClassStudents_(body);
      case 'listSubmissions': return handleListSubmissions_(body);
      case 'listEnrollments': return handleListEnrollments_(body);
      case 'listExamItems': return handleListExamItems_(body);

      // Admin operations
      case 'adminListStudents': return handleAdminListStudents_(body);
      case 'adminListTutors': return handleAdminListTutors_(body);
      case 'adminCreateStudent': return handleAdminCreateStudent_(body);
      case 'adminCreateTutor': return handleAdminCreateTutor_(body);
      case 'adminCreateClass': return handleAdminCreateClass_(body);
      case 'adminCreateSchedule': return handleAdminCreateSchedule_(body);
      case 'adminEnrollStudent': return handleAdminEnrollStudent_(body);
      case 'adminCreateExam': return handleAdminCreateExam_(body);
      case 'adminCreateQuestion': return handleAdminCreateQuestion_(body);
      case 'adminAddQuestionToExam': return handleAdminAddQuestionToExam_(body);
      case 'adminRemoveQuestionFromExam': return handleAdminRemoveQuestionFromExam_(body);
      case 'adminUpdateExamStatus': return handleAdminUpdateExamStatus_(body);
      case 'adminUpdateEnrollment': return handleAdminUpdateEnrollment_(body);
      case 'adminResetUserPassword': return handleAdminResetUserPassword_(body);
      case 'adminUpdateUserStatus': return handleAdminUpdateUserStatus_(body);
      case 'listPackages': return handleListPackages_(body);
      case 'adminUpsertPackage': return handleAdminUpsertPackage_(body);
      case 'adminListOrders': return handleAdminListOrders_(body);
      case 'adminCreateOrder': return handleAdminCreateOrder_(body);
      case 'adminMarkOrderPaid': return handleAdminMarkOrderPaid_(body);
      case 'adminActivateOrder': return handleAdminActivateOrder_(body);
      case 'adminUpdateRegistrationStatus': return handleAdminUpdateRegistrationStatus_(body);
      case 'adminReviewPaymentProof': return handleAdminReviewPaymentProof_(body);
      case 'adminListPaymentSettings': return handleAdminListPaymentSettings_(body);
      case 'adminSavePaymentSettings': return handleAdminSavePaymentSettings_(body);
      case 'adminListSubscriptions': return handleAdminListSubscriptions_(body);
      case 'adminUpdateSubscription': return handleAdminUpdateSubscription_(body);
      case 'adminCreateCalendarEvent': return handleAdminCreateCalendarEvent_(body);
      case 'adminListGuardians': return handleAdminListGuardians_(body);
      case 'adminCreateGuardian': return handleAdminCreateGuardian_(body);
      case 'adminAuditLog': return handleAdminAuditLog_(body);
      case 'adminSystemStatus': return handleAdminSystemStatus_(body);
      case 'adminCreateBackup': return handleAdminCreateBackup_(body);
      case 'adminListBackups': return handleAdminListBackups_(body);

      // Tutor / learning operations
      case 'uploadMaterial': return handleUploadMaterial_(body);
      case 'createAssignment': return handleCreateAssignment_(body);
      case 'recordAttendance': return handleRecordAttendance_(body);
      case 'gradeSubmission': return handleGradeSubmission_(body);

      // Student operations
      case 'submitAssignment': return handleSubmitAssignment_(body);
      case 'startExam': return handleStartExam_(body);
      case 'submitExam': return handleSubmitExam_(body);

      default: return json_({ok:false,message:'Action tidak dikenal.'});
    }
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ok:false,message:'Terjadi kesalahan pada backend Nalarva.'});
  }
}

function handleRegister_(b) {
  const name = clean_(b.name,120), email = clean_(b.email,180).toLowerCase(), phone = clean_(b.phone,40);
  if (!name || !email || !phone) return json_({ok:false,message:'Nama, email, dan WhatsApp wajib diisi.'});
  if(!validEmail_(email))return json_({ok:false,message:'Format email tidak valid.'});
  if(!rateLimit_('REGISTER',email+'|'+phone,4,60*60).ok)return json_({ok:false,message:'Pendaftaran dari kontak ini terlalu sering. Silakan coba kembali nanti.'});
  const row={id:id_('REG'), name:name, email:email, phone:phone, level:clean_(b.level,40), school:clean_(b.school,160),status:'BARU', source:'WEBSITE', created_at:now_()};
  appendObject_('REGISTRATIONS',row);
  const user=findOne_('USERS','email',email);
  if(user)createInAppNotification_(user.id,'PENDAFTARAN','Pendaftaran diterima','Pendaftaran program Nalarva sudah kami terima. Tim Nalarva akan menghubungi Anda.','/dashboard/siswa/langganan','REG-'+row.id);
  emailSafe_(email,'Pendaftaran Nalarva diterima','Halo '+name+', pendaftaran Anda sudah kami terima. Tim Nalarva akan menghubungi Anda untuk membantu memilih program dan paket belajar.',siteUrl_()+'/paket','REG-'+row.id);
  notifyAdmins_('PENDAFTARAN','Pendaftaran baru','Pendaftaran baru dari '+name+' ('+email+').','/dashboard/admin/pendaftaran','ADMIN-REG-'+row.id);
  return json_({ok:true,message:'Pendaftaran berhasil diterima. Tim Nalarva akan menghubungi Anda.'});
}

function handleContact_(b) {
  const name = clean_(b.name,120), phone = clean_(b.phone,40);
  if (!name || !phone) return json_({ok:false,message:'Nama dan WhatsApp wajib diisi.'});
  if(!rateLimit_('CONTACT',phone,6,60*60).ok)return json_({ok:false,message:'Pesan dari nomor ini terlalu sering. Silakan coba kembali nanti.'});
  appendObject_('CONTACTS', {
    id:id_('CON'), name, phone, level:clean_(b.level,40), message:clean_(b.message,1200), status:'BARU', created_at:now_()
  });
  return json_({ok:true,message:'Pesan berhasil diterima. Terima kasih telah menghubungi Nalarva.'});
}



/* =========================================================
 * PRODUCTION OPERATIONS v9
 * Global search, audit, backup, system health
 * ========================================================= */

function pushSearch_(out,type,title,subtitle,href){
  if(out.length>=24)return;
  out.push({type:type,title:String(title||''),subtitle:String(subtitle||''),href:href});
}
function containsQ_(values,q){return values.join(' ').toLowerCase().indexOf(q)>=0;}

function handleGlobalSearch_(b){
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const q=clean_(b.query,80).toLowerCase();if(q.length<2)return json_({ok:true,data:[]});
  const out=[],role=String(a.auth.user.role),users=indexBy_(getRows_('USERS'),'id'),programs=indexBy_(getRows_('PROGRAMS'),'id'),classes=indexBy_(getRows_('CLASSES'),'id');

  if(role==='ADMIN'){
    getRows_('STUDENTS').forEach(s=>{const u=users[String(s.user_id)]||{};if(containsQ_([u.name,u.email,s.student_no,s.school,s.level],q))pushSearch_(out,'SISWA',u.name,u.email+' · '+s.student_no,'/dashboard/admin/siswa')});
    getRows_('TUTORS').forEach(t=>{const u=users[String(t.user_id)]||{};if(containsQ_([u.name,u.email,t.tutor_no,t.specialization],q))pushSearch_(out,'TUTOR',u.name,u.email+' · '+t.specialization,'/dashboard/admin/tutor')});
    getRows_('REGISTRATIONS').forEach(r=>{if(containsQ_([r.name,r.email,r.phone,r.school,r.level],q))pushSearch_(out,'PENDAFTARAN',r.name,r.email+' · '+r.level,'/dashboard/admin/pendaftaran')});
    getRows_('ORDERS').forEach(o=>{if(containsQ_([o.invoice_no,o.status,o.amount],q))pushSearch_(out,'INVOICE',o.invoice_no,'Status '+o.status,'/dashboard/admin/pendaftaran')});
  }

  const visible=role==='ADMIN'?getRows_('CLASSES'):visibleClasses_(a.auth.user);
  visible.forEach(c=>{const p=programs[String(c.program_id)]||{};if(containsQ_([c.name,c.code,p.name],q))pushSearch_(out,'KELAS',c.name,p.name||c.code,role==='ADMIN'?'/dashboard/admin/kelas':role==='TUTOR'?'/dashboard/tutor/kelas':role==='ORANG_TUA'?'/dashboard/orangtua':'/dashboard/siswa/kelas')});
  const classIds=visible.map(c=>String(c.id));

  if(role==='TUTOR'||role==='SISWA'){
    getRows_('MATERIALS').filter(x=>classIds.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED').forEach(m=>{if(containsQ_([m.title,m.description,m.type],q))pushSearch_(out,'MATERI',m.title,(classes[String(m.class_id)]||{}).name||'',role==='TUTOR'?'/dashboard/tutor/materi':'/dashboard/siswa/materi')});
    getRows_('ASSIGNMENTS').filter(x=>classIds.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED').forEach(m=>{if(containsQ_([m.title,m.description],q))pushSearch_(out,'TUGAS',m.title,(classes[String(m.class_id)]||{}).name||'',role==='TUTOR'?'/dashboard/tutor/tugas':'/dashboard/siswa/tugas')});
  }

  if(role==='ADMIN'||role==='SISWA'){
    const allowedPrograms=role==='ADMIN'?getRows_('PROGRAMS').map(p=>String(p.id)):programIdsForUser_(a.auth.user);
    getRows_('EXAMS').filter(e=>allowedPrograms.indexOf(String(e.program_id))>=0).forEach(e=>{if(containsQ_([e.title,e.code],q))pushSearch_(out,'TRYOUT',e.title,e.code,role==='ADMIN'?'/dashboard/admin/tryout':'/dashboard/siswa/tryout')});
  }

  if(role==='ORANG_TUA'){
    guardianStudentIds_(a.auth.user.id).forEach(uid=>{const s=linkedStudentForParent_(a.auth.user.id,uid);if(s&&containsQ_([s.name,s.student_no,s.school,s.program_name],q))pushSearch_(out,'ANAK',s.name,s.student_no+' · '+s.program_name,'/dashboard/orangtua')});
  }

  let calendarRows=getRows_('CALENDAR_EVENTS').filter(e=>String(e.status)==='ACTIVE');
  if(role!=='ADMIN'){
    const calendarClassIds=roleClassIds_(a.auth.user);let calendarProgramIds=[];
    if(role==='SISWA'){const sp=findOne_('STUDENTS','user_id',a.auth.user.id);if(sp&&sp.program_id)calendarProgramIds.push(String(sp.program_id));}
    if(role==='TUTOR')calendarProgramIds=calendarClassIds.map(id=>String((classes[id]||{}).program_id||'')).filter(Boolean);
    if(role==='ORANG_TUA')guardianStudentIds_(a.auth.user.id).forEach(uid=>{const sp=findOne_('STUDENTS','user_id',uid);if(sp&&sp.program_id)calendarProgramIds.push(String(sp.program_id))});
    calendarProgramIds=unique_(calendarProgramIds);
    calendarRows=calendarRows.filter(e=>e.class_id?calendarClassIds.indexOf(String(e.class_id))>=0:e.program_id?calendarProgramIds.indexOf(String(e.program_id))>=0:true);
  }
  calendarRows.forEach(e=>{if(containsQ_([e.title,e.description,e.type],q))pushSearch_(out,'KALENDER',e.title,e.type,role==='ADMIN'?'/dashboard/admin/kalender':role==='TUTOR'?'/dashboard/tutor/kalender':role==='ORANG_TUA'?'/dashboard/orangtua/kalender':'/dashboard/siswa/kalender')});
  return json_({ok:true,data:out.slice(0,24)});
}

function handleAdminAuditLog_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('AUDIT_LOG').sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))).slice(0,1000).map(x=>{
    const u=users[String(x.user_id)]||{};
    return Object.assign({},x,{user_name:u.name||'',user_email:u.email||''});
  });
  return json_({ok:true,data:rows});
}

function createDatabaseBackup_(mode,createdBy){
  const ssId=PropertiesService.getScriptProperties().getProperty('NALARVA_SPREADSHEET_ID');
  if(!ssId)throw new Error('Database belum disiapkan.');
  const stamp=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyyMMdd-HHmmss');
  const name='NALARVA_DB_BACKUP_'+stamp;
  const file=DriveApp.getFileById(ssId).makeCopy(name,subFolder_('Backup Database'));
  const row={id:id_('BKP'),file_id:file.getId(),file_name:name,file_url:file.getUrl(),mode:mode||'MANUAL',status:'READY',created_by:createdBy||'SYSTEM',created_at:now_()};
  appendObject_('BACKUPS',row);
  audit_(createdBy||'SYSTEM','BACKUP','DATABASE',row.id,mode||'MANUAL');
  return row;
}
function createDatabaseBackupWeekly(){return createDatabaseBackup_('AUTO_WEEKLY','SYSTEM');}

function handleAdminCreateBackup_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const row=createDatabaseBackup_('MANUAL',a.auth.user.id);
  return json_({ok:true,message:'Backup database berhasil dibuat di Google Drive.',data:row});
}
function handleAdminListBackups_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('BACKUPS').sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))).map(x=>Object.assign({},x,{created_by_name:((users[String(x.created_by)]||{}).name||(String(x.created_by)==='SYSTEM'?'System':''))}));
  return json_({ok:true,data:rows});
}
function handleAdminSystemStatus_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  cleanupExpiredSessions_();
  const sessions=getRows_('SESSIONS').filter(x=>String(x.status)==='ACTIVE'),backups=getRows_('BACKUPS').sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
  const handlers=ScriptApp.getProjectTriggers().map(t=>t.getHandlerFunction());
  return json_({ok:true,data:{
    version:'9.0-production-ready',
    activeSessions:sessions.length,activeUsers:unique_(sessions.map(x=>String(x.user_id))).length,
    emailQuotaRemaining:MailApp.getRemainingDailyQuota(),
    lastBackupAt:backups[0]?backups[0].created_at:'',
    authPepperConfigured:Boolean(PropertiesService.getScriptProperties().getProperty('NALARVA_AUTH_PEPPER')),
    maintenanceTrigger:handlers.indexOf('runNalarvaMaintenanceDaily')>=0,
    weeklyBackupTrigger:handlers.indexOf('createDatabaseBackupWeekly')>=0
  }});
}

/* =========================================================
 * SECURITY HARDENING v9
 * ========================================================= */

function digestKey_(s){
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,String(s||''));
  return bytesToHex_(bytes).slice(0,32);
}
function rateLimit_(bucket,identity,maxAttempts,ttlSeconds){
  const cache=CacheService.getScriptCache(),key='RL:'+bucket+':'+digestKey_(identity),n=Number(cache.get(key)||0)+1;
  cache.put(key,String(n),ttlSeconds);
  return {ok:n<=maxAttempts,count:n,remaining:Math.max(0,maxAttempts-n)};
}
function clearRateLimit_(bucket,identity){CacheService.getScriptCache().remove('RL:'+bucket+':'+digestKey_(identity));}
function validEmail_(email){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email||''));}
function enforceSessionLimit_(userId,maxSessions){
  const active=getRows_('SESSIONS').filter(x=>String(x.user_id)===String(userId)&&String(x.status)==='ACTIVE').sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
  active.slice(maxSessions||8).forEach(x=>updateRowById_('SESSIONS',x.id,{status:'REVOKED'}));
}
function cleanupExpiredSessions_(){
  const now=new Date();let count=0;
  getRows_('SESSIONS').filter(x=>String(x.status)==='ACTIVE'&&x.expires_at&&new Date(x.expires_at)<=now).forEach(x=>{updateRowById_('SESSIONS',x.id,{status:'EXPIRED'});count++});
  return count;
}

function handleLogin_(b) {
  const email = clean_(b.email,180).toLowerCase();
  const password = String(b.password || '');
  if (!email || !password) return json_({ok:false,message:'Email dan password wajib diisi.'});
  if(!validEmail_(email)) return json_({ok:false,message:'Format email tidak valid.'});
  const guard=rateLimit_('LOGIN',email,6,15*60);
  if(!guard.ok) return json_({ok:false,message:'Terlalu banyak percobaan login. Coba kembali beberapa saat lagi.'});
  const user = findOne_('USERS','email',email);
  if (!user || String(user.status) !== 'ACTIVE') return json_({ok:false,message:'Email atau password tidak sesuai.'});
  const expected = hashPassword_(password, String(user.salt));
  if (!safeEqual_(expected, String(user.password_hash))) return json_({ok:false,message:'Email atau password tidak sesuai.'});

  const rawToken = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  const created = new Date();
  const expires = new Date(created.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  appendObject_('SESSIONS', {
    id:id_('SES'), user_id:user.id, token_hash:hashToken_(rawToken), created_at:iso_(created), expires_at:iso_(expires), status:'ACTIVE'
  });
  clearRateLimit_('LOGIN',email);enforceSessionLimit_(user.id,8);
  audit_(user.id,'LOGIN','USER',user.id,'Login berhasil');
  return json_({ok:true,message:'Login berhasil.',data:{token:rawToken,user:publicUser_(user),expiresAt:iso_(expires)}});
}

function handleMe_(b) {
  const auth = sessionUser_(String(b.token || ''));
  if (!auth) return json_({ok:false,message:'Sesi tidak valid atau sudah berakhir.'});
  return json_({ok:true,data:{token:String(b.token),user:publicUser_(auth.user),expiresAt:auth.session.expires_at}});
}

function handleLogout_(b) {
  const token = String(b.token || '');
  if (!token) return json_({ok:true,message:'Sudah keluar.'});
  const sessions = getRows_('SESSIONS');
  const hash = hashToken_(token);
  const row = sessions.find(x => String(x.token_hash) === hash && String(x.status) === 'ACTIVE');
  if (row) {
    updateRowById_('SESSIONS', row.id, {status:'REVOKED'});
    audit_(row.user_id,'LOGOUT','SESSION',row.id,'Logout');
  }
  return json_({ok:true,message:'Berhasil keluar.'});
}



function strongPassword_(password) {
  const p=String(password||'');
  return p.length>=10 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
}

function revokeUserSessions_(userId) {
  getRows_('SESSIONS').filter(x=>String(x.user_id)===String(userId)&&String(x.status)==='ACTIVE').forEach(x=>updateRowById_('SESSIONS',x.id,{status:'REVOKED'}));
}

function handleChangePassword_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']); if(!a.ok) return authError_(a);
  const current=String(b.currentPassword||''),next=String(b.newPassword||'');
  if(!safeEqual_(hashPassword_(current,String(a.auth.user.salt)),String(a.auth.user.password_hash))) return json_({ok:false,message:'Password saat ini tidak sesuai.'});
  if(!strongPassword_(next)) return json_({ok:false,message:'Password baru minimal 10 karakter dan harus mengandung huruf besar, huruf kecil, angka, serta simbol.'});
  const salt=Utilities.getUuid(); updateRowById_('USERS',a.auth.user.id,{salt:salt,password_hash:hashPassword_(next,salt),updated_at:now_()});
  revokeUserSessions_(a.auth.user.id); audit_(a.auth.user.id,'CHANGE_PASSWORD','USER',a.auth.user.id,'Password diubah oleh pemilik akun');
  return json_({ok:true,message:'Password berhasil diubah. Silakan masuk kembali.'});
}

function handleAdminResetUserPassword_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const user=findOne_('USERS','id',b.userId); if(!user) return json_({ok:false,message:'Akun tidak ditemukan.'});
  const password=tempPassword_(),salt=Utilities.getUuid();updateRowById_('USERS',user.id,{salt:salt,password_hash:hashPassword_(password,salt),updated_at:now_()});revokeUserSessions_(user.id);
  audit_(a.auth.user.id,'RESET_PASSWORD','USER',user.id,'Reset password '+user.email);
  return json_({ok:true,message:'Password sementara baru: '+password,data:{temporaryPassword:password}});
}

function handleAdminUpdateUserStatus_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const user=findOne_('USERS','id',b.userId); if(!user) return json_({ok:false,message:'Akun tidak ditemukan.'});
  const status=clean_(b.status,20).toUpperCase();if(['ACTIVE','SUSPENDED'].indexOf(status)<0) return json_({ok:false,message:'Status akun tidak valid.'});
  updateRowById_('USERS',user.id,{status:status,updated_at:now_()});
  const stu=findOne_('STUDENTS','user_id',user.id);if(stu)updateRowById_('STUDENTS',stu.id,{status:status});
  const tut=findOne_('TUTORS','user_id',user.id);if(tut)updateRowById_('TUTORS',tut.id,{status:status});
  if(status!=='ACTIVE')revokeUserSessions_(user.id);
  audit_(a.auth.user.id,'UPDATE_STATUS','USER',user.id,status);
  return json_({ok:true,message:status==='ACTIVE'?'Akun berhasil diaktifkan.':'Akun berhasil dinonaktifkan.'});
}

function upcomingSchedulesForClasses_(classIds,limit) {
  const classes=indexBy_(getRows_('CLASSES'),'id'),now=new Date();
  return getRows_('SCHEDULES').filter(x=>classIds.indexOf(String(x.class_id))>=0&&(!x.start_at||new Date(x.start_at)>=now)&&String(x.status)!=='CANCELLED').sort((x,y)=>String(x.start_at).localeCompare(String(y.start_at))).slice(0,limit||5).map(x=>Object.assign({},x,{class_name:(classes[String(x.class_id)]||{}).name||''}));
}

function handleAdminOverview_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const students=getRows_('STUDENTS').filter(x=>String(x.status)==='ACTIVE').length,tutors=getRows_('TUTORS').filter(x=>String(x.status)==='ACTIVE').length,classesRows=getRows_('CLASSES').filter(x=>String(x.status)==='ACTIVE'),exams=getRows_('EXAMS').filter(x=>String(x.status)==='PUBLISHED').length;
  const regs=getRows_('REGISTRATIONS').sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))),newRegs=regs.filter(x=>String(x.status)==='BARU').length;
  const orders=getRows_('ORDERS'),pendingPayments=orders.filter(x=>String(x.status)==='MENUNGGU_PEMBAYARAN').length,paidOrders=orders.filter(x=>String(x.status)==='PAID').length,revenue=orders.filter(x=>['PAID','ACTIVATED'].indexOf(String(x.status))>=0).reduce((s,x)=>s+Number(x.amount||0),0);
  return json_({ok:true,data:{students:students,tutors:tutors,classes:classesRows.length,exams:exams,registrations:newRegs,pendingPayments:pendingPayments,paidOrders:paidOrders,revenue:revenue,recentRegistrations:regs.slice(0,5),upcomingSchedules:upcomingSchedulesForClasses_(classesRows.map(x=>String(x.id)),5)}});
}

function handleTutorOverview_(b) {
  const a=authRequest_(b,['TUTOR']); if(!a.ok) return authError_(a);const ids=classIdsForUser_(a.auth.user);
  const studentIds=unique_(getRows_('ENROLLMENTS').filter(x=>ids.indexOf(String(x.class_id))>=0&&String(x.status)==='ACTIVE').map(x=>String(x.student_user_id)));
  const asgIds=getRows_('ASSIGNMENTS').filter(x=>ids.indexOf(String(x.class_id))>=0).map(x=>String(x.id));
  const subs=getRows_('SUBMISSIONS').filter(x=>asgIds.indexOf(String(x.assignment_id))>=0),pending=subs.filter(x=>String(x.status)==='SUBMITTED').length,graded=subs.filter(x=>String(x.score)!=='');
  const avg=graded.length?Math.round(graded.reduce((sum,x)=>sum+Number(x.score||0),0)/graded.length*10)/10:null;
  return json_({ok:true,data:{classes:ids.length,students:studentIds.length,pendingSubmissions:pending,averageScore:avg,upcomingSchedules:upcomingSchedulesForClasses_(ids,5)}});
}

function handleStudentOverview_(b) {
  const a=authRequest_(b,['SISWA']); if(!a.ok) return authError_(a);const access=studentAccessData_(a.auth.user.id),ids=classIdsForUser_(a.auth.user),classNames=indexBy_(getRows_('CLASSES'),'id');
  const assignments=getRows_('ASSIGNMENTS').filter(x=>ids.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED'),subs=getRows_('SUBMISSIONS').filter(x=>String(x.student_user_id)===String(a.auth.user.id));
  const submittedIds=unique_(subs.filter(x=>['SUBMITTED','GRADED'].indexOf(String(x.status))>=0).map(x=>String(x.assignment_id))),progress=assignments.length?Math.round(submittedIds.length/assignments.length*100):0,pending=Math.max(0,assignments.length-submittedIds.length);
  let results=getRows_('RESULTS').filter(x=>String(x.student_user_id)===String(a.auth.user.id));results.sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));const latest=results[0]||null;
  let materials=getRows_('MATERIALS').filter(x=>ids.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED').sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at))).slice(0,5).map(x=>Object.assign({},x,{class_name:(classNames[String(x.class_id)]||{}).name||''}));
  return json_({ok:true,data:{access:access,progress:progress,lastScore:latest?Number(latest.score):null,rank:latest?Number(latest.rank)||null:null,pendingAssignments:pending,classes:ids.length,upcomingSchedules:upcomingSchedulesForClasses_(ids,4),recentMaterials:materials}});
}

/* =========================================================
 * OPERATIONAL API v2
 * ======================================================= */

function authRequest_(b, roles) {
  const auth = sessionUser_(String(b.token || ''));
  if (!auth) return {ok:false,message:'Sesi tidak valid atau sudah berakhir.'};
  const role = String(auth.user.role);
  if (roles && roles.length && roles.indexOf(role) < 0) return {ok:false,message:'Anda tidak memiliki akses untuk tindakan ini.'};
  return {ok:true,auth:auth};
}

function authError_(r) { return json_({ok:false,message:r.message || 'Akses ditolak.'}); }

function handleListPrograms_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']); if(!a.ok) return authError_(a);
  return json_({ok:true,data:getRows_('PROGRAMS').filter(x=>String(x.status)!=='ARCHIVED')});
}

function classIdsForUser_(user) {
  const role=String(user.role);
  if(role==='ADMIN') return getRows_('CLASSES').map(x=>String(x.id));
  if(role==='TUTOR') return getRows_('CLASSES').filter(x=>String(x.tutor_user_id)===String(user.id)).map(x=>String(x.id));
  if(role==='ORANG_TUA'){
    const studentIds=guardianStudentIds_(user.id);
    return unique_(getRows_('ENROLLMENTS').filter(x=>studentIds.indexOf(String(x.student_user_id))>=0&&String(x.status)==='ACTIVE').map(x=>String(x.class_id)));
  }
  if(!hasLearningAccess_(user.id)) return [];
  return getRows_('ENROLLMENTS').filter(x=>String(x.student_user_id)===String(user.id) && String(x.status)!=='INACTIVE').map(x=>String(x.class_id));
}

function visibleClasses_(user) {
  const ids=classIdsForUser_(user);
  const programs=indexBy_(getRows_('PROGRAMS'),'id');
  const users=indexBy_(getRows_('USERS'),'id');
  const enrollments=getRows_('ENROLLMENTS');
  return getRows_('CLASSES').filter(x=>ids.indexOf(String(x.id))>=0).map(x=>{
    const p=programs[String(x.program_id)]||{},t=users[String(x.tutor_user_id)]||{};
    const count=enrollments.filter(e=>String(e.class_id)===String(x.id)&&String(e.status)==='ACTIVE').length;
    return Object.assign({},x,{program_name:p.name||'',tutor_name:t.name||'',enrolled_count:count});
  });
}

function handleListClasses_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']); if(!a.ok) return authError_(a);
  return json_({ok:true,data:visibleClasses_(a.auth.user)});
}

function handleListSchedules_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']); if(!a.ok) return authError_(a);
  const classes=visibleClasses_(a.auth.user), names=indexBy_(classes,'id'), ids=classes.map(x=>String(x.id));
  const rows=getRows_('SCHEDULES').filter(x=>ids.indexOf(String(x.class_id))>=0).map(x=>Object.assign({},x,{class_name:(names[String(x.class_id)]||{}).name||''}));
  rows.sort((x,y)=>String(x.start_at).localeCompare(String(y.start_at)));
  return json_({ok:true,data:rows});
}

function handleListMaterials_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA']); if(!a.ok) return authError_(a);
  const classes=visibleClasses_(a.auth.user), names=indexBy_(classes,'id'), ids=classes.map(x=>String(x.id));
  const rows=getRows_('MATERIALS').filter(x=>ids.indexOf(String(x.class_id))>=0 && (String(a.auth.user.role)!=='SISWA'||String(x.status)==='PUBLISHED'))
    .map(x=>Object.assign({},x,{class_name:(names[String(x.class_id)]||{}).name||''}));
  rows.sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));
  return json_({ok:true,data:rows});
}

function handleListAssignments_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA']); if(!a.ok) return authError_(a);
  const classes=visibleClasses_(a.auth.user), names=indexBy_(classes,'id'), ids=classes.map(x=>String(x.id));
  const submissions=String(a.auth.user.role)==='SISWA'?getRows_('SUBMISSIONS').filter(s=>String(s.student_user_id)===String(a.auth.user.id)):[];
  const subByAssignment={}; submissions.forEach(s=>subByAssignment[String(s.assignment_id)]=s);
  const rows=getRows_('ASSIGNMENTS').filter(x=>ids.indexOf(String(x.class_id))>=0 && (String(a.auth.user.role)!=='SISWA'||String(x.status)==='PUBLISHED')).map(x=>{
    const s=subByAssignment[String(x.id)]||{};
    return Object.assign({},x,{class_name:(names[String(x.class_id)]||{}).name||'',submission_status:s.status||'BELUM',score:s.score==null?'':s.score,submission_id:s.id||''});
  });
  rows.sort((x,y)=>String(x.due_at).localeCompare(String(y.due_at)));
  return json_({ok:true,data:rows});
}

function programIdsForUser_(user) {
  if(String(user.role)==='ADMIN') return getRows_('PROGRAMS').map(x=>String(x.id));
  const classPrograms=visibleClasses_(user).map(x=>String(x.program_id));
  if(String(user.role)==='SISWA') {
    if(!hasLearningAccess_(user.id)) return [];
    const sp=findOne_('STUDENTS','user_id',user.id);
    if(sp && sp.program_id) classPrograms.push(String(sp.program_id));
  }
  return unique_(classPrograms);
}

function handleListExams_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA']); if(!a.ok) return authError_(a);
  const pids=programIdsForUser_(a.auth.user), programs=indexBy_(getRows_('PROGRAMS'),'id');
  const items=getRows_('EXAM_ITEMS');
  const rows=getRows_('EXAMS').filter(x=>pids.indexOf(String(x.program_id))>=0 && (String(a.auth.user.role)!=='SISWA'||String(x.status)==='PUBLISHED')).map(x=>Object.assign({},x,{
    program_name:(programs[String(x.program_id)]||{}).name||'',
    question_count:items.filter(i=>String(i.exam_id)===String(x.id)).length
  }));
  return json_({ok:true,data:rows});
}

function handleListQuestions_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  const pids=programIdsForUser_(a.auth.user);
  return json_({ok:true,data:getRows_('QUESTIONS').filter(x=>pids.indexOf(String(x.program_id))>=0)});
}

function handleAdminListStudents_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('STUDENTS').map(s=>Object.assign({},s,{
    id:String(s.user_id),name:(users[String(s.user_id)]||{}).name||'',email:(users[String(s.user_id)]||{}).email||''
  }));
  return json_({ok:true,data:rows});
}

function handleAdminListTutors_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('TUTORS').map(t=>Object.assign({},t,{
    id:String(t.user_id),name:(users[String(t.user_id)]||{}).name||'',email:(users[String(t.user_id)]||{}).email||''
  }));
  return json_({ok:true,data:rows});
}

function tempPassword_(){return 'Nv#'+Utilities.getUuid().replace(/-/g,'').slice(0,10)+'!';}
function nextNo_(prefix,sheet){return prefix+String(getRows_(sheet).length+1).padStart(4,'0');}

function handleAdminCreateStudent_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const name=clean_(b.name,120),email=clean_(b.email,180).toLowerCase();
  if(!name||!email) return json_({ok:false,message:'Nama dan email siswa wajib diisi.'});
  if(findOne_('USERS','email',email)) return json_({ok:false,message:'Email tersebut sudah terdaftar.'});
  const cls=b.classId?findOne_('CLASSES','id',b.classId):null;
  if(cls){const used=getRows_('ENROLLMENTS').filter(x=>String(x.class_id)===String(cls.id)&&String(x.status)==='ACTIVE').length;if(used>=Number(cls.capacity||0)&&Number(cls.capacity||0)>0)return json_({ok:false,message:'Kapasitas kelas sudah penuh.'});}
  const password=tempPassword_(), user=createUser(email,password,'SISWA',name);
  let programId='';
  if(cls) programId=String(cls.program_id||'');
  if(!programId) {
    const level=clean_(b.level,20).replace(/^TKA\s*/i,'').toUpperCase();
    const p=getRows_('PROGRAMS').find(x=>String(x.level).toUpperCase()===level);
    if(p) programId=String(p.id);
  }
  appendObject_('STUDENTS',{id:id_('STU'),user_id:user.id,student_no:nextNo_('NV-S-', 'STUDENTS'),level:clean_(b.level,20),school:clean_(b.school,160),parent_name:clean_(b.parentName,120),parent_phone:clean_(b.parentPhone,40),program_id:programId,status:'ACTIVE',joined_at:now_()});
  if(cls) appendObject_('ENROLLMENTS',{id:id_('ENR'),class_id:cls.id,student_user_id:user.id,status:'ACTIVE',enrolled_at:now_()});
  if(programId) grantManualSubscription_(user.id,programId,'MANUAL_ADMIN');
  audit_(a.auth.user.id,'CREATE','STUDENT',user.id,'Membuat akun siswa '+email);
  return json_({ok:true,message:'Akun siswa dibuat. Password sementara: '+password,data:{id:user.id,email:user.email,temporaryPassword:password}});
}

function handleAdminCreateTutor_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const name=clean_(b.name,120),email=clean_(b.email,180).toLowerCase();
  if(!name||!email) return json_({ok:false,message:'Nama dan email tutor wajib diisi.'});
  if(findOne_('USERS','email',email)) return json_({ok:false,message:'Email tersebut sudah terdaftar.'});
  const password=tempPassword_(),user=createUser(email,password,'TUTOR',name);
  appendObject_('TUTORS',{id:id_('TUT'),user_id:user.id,tutor_no:nextNo_('NV-T-','TUTORS'),specialization:clean_(b.specialization,180),phone:clean_(b.phone,40),status:'ACTIVE',joined_at:now_()});
  audit_(a.auth.user.id,'CREATE','TUTOR',user.id,'Membuat akun tutor '+email);
  return json_({ok:true,message:'Akun tutor dibuat. Password sementara: '+password,data:{id:user.id,email:user.email,temporaryPassword:password}});
}

function handleAdminCreateClass_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const program=findOne_('PROGRAMS','id',b.programId);
  if(!program) return json_({ok:false,message:'Program tidak ditemukan.'});
  const code=clean_(b.code,40).toUpperCase(),name=clean_(b.name,160);
  if(!code||!name) return json_({ok:false,message:'Kode dan nama kelas wajib diisi.'});
  if(findOne_('CLASSES','code',code)) return json_({ok:false,message:'Kode kelas sudah digunakan.'});
  const row={id:id_('CLS'),program_id:program.id,code,name,tutor_user_id:clean_(b.tutorUserId,80),capacity:Number(b.capacity)||20,status:'ACTIVE',start_date:clean_(b.startDate,40),end_date:clean_(b.endDate,40)};
  appendObject_('CLASSES',row); audit_(a.auth.user.id,'CREATE','CLASS',row.id,name);
  return json_({ok:true,message:'Kelas berhasil dibuat.',data:row});
}

function handleAdminCreateSchedule_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const cls=findOne_('CLASSES','id',b.classId); if(!cls) return json_({ok:false,message:'Kelas tidak ditemukan.'});
  const row={id:id_('SCH'),class_id:cls.id,title:clean_(b.title,180),start_at:clean_(b.startAt,60),end_at:clean_(b.endAt,60),meeting_url:clean_(b.meetingUrl,500),notes:clean_(b.notes,1200),status:'SCHEDULED'};
  appendObject_('SCHEDULES',row); audit_(a.auth.user.id,'CREATE','SCHEDULE',row.id,row.title);
  return json_({ok:true,message:'Jadwal berhasil dibuat.',data:row});
}


function handleAdminEnrollStudent_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const cls=findOne_('CLASSES','id',b.classId), user=findOne_('USERS','id',b.studentUserId);
  if(!cls||!user||String(user.role)!=='SISWA') return json_({ok:false,message:'Kelas atau siswa tidak ditemukan.'});
  const activeCount=getRows_('ENROLLMENTS').filter(x=>String(x.class_id)===String(cls.id)&&String(x.status)==='ACTIVE'&&String(x.student_user_id)!==String(user.id)).length;
  if(Number(cls.capacity||0)>0&&activeCount>=Number(cls.capacity)) return json_({ok:false,message:'Kapasitas kelas sudah penuh.'});
  const exists=getRows_('ENROLLMENTS').find(x=>String(x.class_id)===String(cls.id)&&String(x.student_user_id)===String(user.id));
  if(exists) {
    updateRowById_('ENROLLMENTS',exists.id,{status:'ACTIVE'});
    return json_({ok:true,message:'Pendaftaran kelas siswa diaktifkan kembali.'});
  }
  appendObject_('ENROLLMENTS',{id:id_('ENR'),class_id:cls.id,student_user_id:user.id,status:'ACTIVE',enrolled_at:now_()});
  const sp=findOne_('STUDENTS','user_id',user.id); if(sp) updateRowById_('STUDENTS',sp.id,{program_id:cls.program_id});
  audit_(a.auth.user.id,'ENROLL','CLASS',cls.id,'Siswa '+user.email);
  return json_({ok:true,message:'Siswa berhasil dimasukkan ke kelas.'});
}


function handleListEnrollments_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);const classes=indexBy_(getRows_('CLASSES'),'id'),users=indexBy_(getRows_('USERS'),'id');
  let rows=getRows_('ENROLLMENTS');if(b.classId)rows=rows.filter(x=>String(x.class_id)===String(b.classId));
  rows=rows.map(x=>Object.assign({},x,{class_name:(classes[String(x.class_id)]||{}).name||'',student_name:(users[String(x.student_user_id)]||{}).name||'',student_email:(users[String(x.student_user_id)]||{}).email||''}));
  return json_({ok:true,data:rows});
}

function handleAdminUpdateEnrollment_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);const row=findOne_('ENROLLMENTS','id',b.enrollmentId);if(!row)return json_({ok:false,message:'Enrollment tidak ditemukan.'});
  const status=clean_(b.status,20).toUpperCase();if(['ACTIVE','INACTIVE'].indexOf(status)<0)return json_({ok:false,message:'Status enrollment tidak valid.'});
  if(status==='ACTIVE'){const cls=findOne_('CLASSES','id',row.class_id);const count=getRows_('ENROLLMENTS').filter(x=>String(x.class_id)===String(row.class_id)&&String(x.status)==='ACTIVE'&&String(x.id)!==String(row.id)).length;if(cls&&Number(cls.capacity||0)>0&&count>=Number(cls.capacity))return json_({ok:false,message:'Kapasitas kelas sudah penuh.'});}
  updateRowById_('ENROLLMENTS',row.id,{status:status});audit_(a.auth.user.id,'UPDATE_ENROLLMENT','ENROLLMENT',row.id,status);return json_({ok:true,message:status==='ACTIVE'?'Enrollment diaktifkan kembali.':'Siswa dikeluarkan dari kelas.'});
}

function classAllowed_(user,classId) { return classIdsForUser_(user).indexOf(String(classId))>=0; }

function driveRoot_(){
  const id=PropertiesService.getScriptProperties().getProperty('NALARVA_DRIVE_ROOT_ID');
  if(!id) throw new Error('Folder Drive belum disiapkan. Jalankan setupNalarva().');
  return DriveApp.getFolderById(id);
}
function subFolder_(name){return ensureChildFolder_(driveRoot_(),name);}
function safeFileName_(name){return clean_(name,180).replace(/[\\/:*?"<>|]/g,'_')||('file-'+Date.now());}
function saveDataUrl_(folderName,fileName,mimeType,dataUrl) {
  const raw=String(dataUrl||''), comma=raw.indexOf(',');
  const b64=comma>=0?raw.slice(comma+1):raw;
  if(!b64 || b64.length>6000000) throw new Error('File terlalu besar. Maksimal sekitar 4 MB.');
  const bytes=Utilities.base64Decode(b64);
  const blob=Utilities.newBlob(bytes,clean_(mimeType,120)||'application/octet-stream',safeFileName_(fileName));
  const file=subFolder_(folderName).createFile(blob);
  try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW); } catch(e) { console.log('Sharing mengikuti kebijakan Drive: '+e); }
  return file;
}


function savePrivateDataUrl_(folderName,fileName,mimeType,dataUrl) {
  const raw=String(dataUrl||''), comma=raw.indexOf(',');
  const b64=comma>=0?raw.slice(comma+1):raw;
  if(!b64 || b64.length>6000000) throw new Error('File terlalu besar. Maksimal sekitar 4 MB.');
  const bytes=Utilities.base64Decode(b64);
  const blob=Utilities.newBlob(bytes,clean_(mimeType,120)||'application/octet-stream',safeFileName_(fileName));
  return subFolder_(folderName).createFile(blob);
}

function handleUploadMaterial_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  if(!classAllowed_(a.auth.user,b.classId)) return json_({ok:false,message:'Kelas tidak dapat diakses.'});
  const file=saveDataUrl_('Materi',b.fileName,b.mimeType,b.base64);
  const row={id:id_('MAT'),class_id:String(b.classId),title:clean_(b.title,180),type:clean_(b.type,30)||'FILE',drive_file_id:file.getId(),drive_url:file.getUrl(),description:clean_(b.description,1200),published_at:now_(),status:'PUBLISHED'};
  appendObject_('MATERIALS',row); audit_(a.auth.user.id,'CREATE','MATERIAL',row.id,row.title);
  return json_({ok:true,message:'Materi berhasil diunggah ke Google Drive dan dipublikasikan.',data:row});
}

function handleCreateAssignment_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  if(!classAllowed_(a.auth.user,b.classId)) return json_({ok:false,message:'Kelas tidak dapat diakses.'});
  const row={id:id_('ASG'),class_id:String(b.classId),title:clean_(b.title,180),description:clean_(b.description,1600),due_at:clean_(b.dueAt,60),drive_file_id:'',status:'PUBLISHED',created_at:now_()};
  appendObject_('ASSIGNMENTS',row); audit_(a.auth.user.id,'CREATE','ASSIGNMENT',row.id,row.title);
  return json_({ok:true,message:'Tugas berhasil dipublikasikan.',data:row});
}

function handleListClassStudents_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  if(!classAllowed_(a.auth.user,b.classId)) return json_({ok:false,message:'Kelas tidak dapat diakses.'});
  const ids=getRows_('ENROLLMENTS').filter(x=>String(x.class_id)===String(b.classId)&&String(x.status)!=='INACTIVE').map(x=>String(x.student_user_id));
  const users=indexBy_(getRows_('USERS'),'id'), profiles={}; getRows_('STUDENTS').forEach(s=>profiles[String(s.user_id)]=s);
  const rows=ids.map(id=>Object.assign({id:id,name:(users[id]||{}).name||'',email:(users[id]||{}).email||''},profiles[id]||{}));
  return json_({ok:true,data:rows});
}

function handleRecordAttendance_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  const schedule=findOne_('SCHEDULES','id',b.scheduleId); if(!schedule) return json_({ok:false,message:'Jadwal tidak ditemukan.'});
  if(!classAllowed_(a.auth.user,schedule.class_id)) return json_({ok:false,message:'Kelas tidak dapat diakses.'});
  const existing=getRows_('ATTENDANCE').find(x=>String(x.schedule_id)===String(b.scheduleId)&&String(x.student_user_id)===String(b.studentUserId));
  const patch={status:clean_(b.status,20).toUpperCase(),checkin_at:now_(),notes:clean_(b.notes,500)};
  if(existing) updateRowById_('ATTENDANCE',existing.id,patch);
  else appendObject_('ATTENDANCE',Object.assign({id:id_('ATT'),schedule_id:String(b.scheduleId),student_user_id:String(b.studentUserId)},patch));
  if(patch.status==='ALPHA'||patch.status==='IZIN'){const stu=findOne_('USERS','id',b.studentUserId);notifyGuardiansForStudent_(b.studentUserId,'KEHADIRAN','Pembaruan kehadiran '+(stu?stu.name:'siswa'),'Status kehadiran: '+patch.status+'. '+(patch.notes||''),'/dashboard/orangtua/kehadiran','ATT-'+b.scheduleId+'-'+b.studentUserId+'-'+patch.status);}
  return json_({ok:true,message:'Absensi berhasil diperbarui.'});
}

function handleSubmitAssignment_(b) {
  const a=authRequest_(b,['SISWA']); if(!a.ok) return authError_(a); if(!hasLearningAccess_(a.auth.user.id)) return json_({ok:false,message:'Masa aktif paket belajar belum tersedia atau sudah berakhir.'});
  const asg=findOne_('ASSIGNMENTS','id',b.assignmentId); if(!asg||!classAllowed_(a.auth.user,asg.class_id)) return json_({ok:false,message:'Tugas tidak ditemukan.'});
  const file=saveDataUrl_('Upload Siswa',b.fileName,b.mimeType,b.base64);
  const existing=getRows_('SUBMISSIONS').find(x=>String(x.assignment_id)===String(asg.id)&&String(x.student_user_id)===String(a.auth.user.id));
  if(existing) {
    updateRowById_('SUBMISSIONS',existing.id,{drive_file_id:file.getId(),drive_url:file.getUrl(),submitted_at:now_(),score:'',feedback:'',status:'SUBMITTED'});
    return json_({ok:true,message:'Jawaban tugas berhasil diperbarui.'});
  }
  appendObject_('SUBMISSIONS',{id:id_('SUB'),assignment_id:asg.id,student_user_id:a.auth.user.id,drive_file_id:file.getId(),drive_url:file.getUrl(),submitted_at:now_(),score:'',feedback:'',status:'SUBMITTED'});
  return json_({ok:true,message:'Tugas berhasil dikumpulkan.'});
}

function handleListSubmissions_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  const ids=classIdsForUser_(a.auth.user), assignments=getRows_('ASSIGNMENTS').filter(x=>ids.indexOf(String(x.class_id))>=0), amap=indexBy_(assignments,'id'), users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('SUBMISSIONS').filter(x=>Boolean(amap[String(x.assignment_id)])).map(x=>Object.assign({},x,{assignment_title:(amap[String(x.assignment_id)]||{}).title||'',student_name:(users[String(x.student_user_id)]||{}).name||''}));
  rows.sort((x,y)=>String(y.submitted_at).localeCompare(String(x.submitted_at)));
  return json_({ok:true,data:rows});
}

function handleGradeSubmission_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR']); if(!a.ok) return authError_(a);
  const sub=findOne_('SUBMISSIONS','id',b.submissionId); if(!sub) return json_({ok:false,message:'Submission tidak ditemukan.'});
  const asg=findOne_('ASSIGNMENTS','id',sub.assignment_id); if(!asg||!classAllowed_(a.auth.user,asg.class_id)) return json_({ok:false,message:'Anda tidak dapat menilai submission ini.'});
  const score=Math.max(0,Math.min(100,Number(b.score)||0));
  updateRowById_('SUBMISSIONS',sub.id,{score:score,feedback:clean_(b.feedback,1200),status:'GRADED'});
  audit_(a.auth.user.id,'GRADE','SUBMISSION',sub.id,'Score '+score);
  const stu=findOne_('USERS','id',sub.student_user_id);notifyGuardiansForStudent_(sub.student_user_id,'NILAI','Nilai tugas '+(stu?stu.name:'siswa'),'Nilai '+String(asg.title||'tugas')+' telah diperbarui: '+score+'.','/dashboard/orangtua/perkembangan','GRADE-'+sub.id);
  return json_({ok:true,message:'Nilai dan feedback berhasil disimpan.'});
}

function handleAdminCreateExam_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  if(!findOne_('PROGRAMS','id',b.programId)) return json_({ok:false,message:'Program tidak ditemukan.'});
  const code=clean_(b.code,50).toUpperCase(); if(findOne_('EXAMS','code',code)) return json_({ok:false,message:'Kode tryout sudah digunakan.'});
  const row={id:id_('EXM'),program_id:String(b.programId),code:code,title:clean_(b.title,180),duration_minutes:Number(b.durationMinutes)||60,start_at:clean_(b.startAt,60),end_at:clean_(b.endAt,60),status:clean_(b.status,30)||'DRAFT',created_at:now_()};
  appendObject_('EXAMS',row); audit_(a.auth.user.id,'CREATE','EXAM',row.id,row.title);
  return json_({ok:true,message:'Tryout berhasil dibuat.',data:row});
}

function handleAdminCreateQuestion_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const row={id:id_('QUE'),program_id:String(b.programId),subject:clean_(b.subject,100),topic:clean_(b.topic,120),question_type:'MCQ',question_text:clean_(b.questionText,3000),option_a:clean_(b.optionA,1200),option_b:clean_(b.optionB,1200),option_c:clean_(b.optionC,1200),option_d:clean_(b.optionD,1200),option_e:clean_(b.optionE,1200),correct_answer:clean_(b.correctAnswer,2).toUpperCase(),explanation:clean_(b.explanation,3000),difficulty:clean_(b.difficulty,30)||'SEDANG',status:'ACTIVE'};
  if(!row.question_text||!row.option_a||!row.option_b||!row.correct_answer) return json_({ok:false,message:'Pertanyaan, pilihan jawaban, dan kunci wajib diisi.'});
  appendObject_('QUESTIONS',row); return json_({ok:true,message:'Soal berhasil ditambahkan ke bank soal.',data:row});
}

function handleAdminAddQuestionToExam_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const exam=findOne_('EXAMS','id',b.examId),q=findOne_('QUESTIONS','id',b.questionId);
  if(!exam||!q) return json_({ok:false,message:'Tryout atau soal tidak ditemukan.'});
  const exists=getRows_('EXAM_ITEMS').find(x=>String(x.exam_id)===String(exam.id)&&String(x.question_id)===String(q.id));
  if(exists) return json_({ok:false,message:'Soal tersebut sudah ada di tryout.'});
  const order=getRows_('EXAM_ITEMS').filter(x=>String(x.exam_id)===String(exam.id)).length+1;
  const row={id:id_('EIT'),exam_id:exam.id,question_id:q.id,order_no:order,points:Number(b.points)||1};
  appendObject_('EXAM_ITEMS',row); return json_({ok:true,message:'Soal berhasil ditambahkan ke tryout.',data:row});
}


function handleListExamItems_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);const exam=findOne_('EXAMS','id',b.examId);if(!exam)return json_({ok:false,message:'Tryout tidak ditemukan.'});const qmap=indexBy_(getRows_('QUESTIONS'),'id');
  const rows=getRows_('EXAM_ITEMS').filter(x=>String(x.exam_id)===String(exam.id)).sort((x,y)=>Number(x.order_no)-Number(y.order_no)).map(x=>{const q=qmap[String(x.question_id)]||{};return Object.assign({},q,x,{id:String(x.id),question_id:String(x.question_id)});});return json_({ok:true,data:rows});
}

function handleAdminRemoveQuestionFromExam_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);const row=findOne_('EXAM_ITEMS','id',b.examItemId);if(!row)return json_({ok:false,message:'Item soal tidak ditemukan.'});
  const sh=db_().getSheetByName('EXAM_ITEMS'),ids=sh.getRange(2,1,Math.max(0,sh.getLastRow()-1),1).getValues().flat().map(String),idx=ids.indexOf(String(row.id));if(idx<0)return json_({ok:false,message:'Item soal tidak ditemukan.'});sh.deleteRow(idx+2);return json_({ok:true,message:'Soal dikeluarkan dari tryout.'});
}

function handleAdminUpdateExamStatus_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);const exam=findOne_('EXAMS','id',b.examId);if(!exam)return json_({ok:false,message:'Tryout tidak ditemukan.'});const status=clean_(b.status,30).toUpperCase();if(['DRAFT','PUBLISHED','ARCHIVED'].indexOf(status)<0)return json_({ok:false,message:'Status tryout tidak valid.'});
  if(status==='PUBLISHED'){const count=getRows_('EXAM_ITEMS').filter(x=>String(x.exam_id)===String(exam.id)).length;if(!count)return json_({ok:false,message:'Tambahkan minimal satu soal sebelum tryout dipublikasikan.'});if(exam.start_at&&exam.end_at&&new Date(exam.end_at)<=new Date(exam.start_at))return json_({ok:false,message:'Waktu selesai tryout harus setelah waktu mulai.'});}
  updateRowById_('EXAMS',exam.id,{status:status});audit_(a.auth.user.id,'UPDATE_STATUS','EXAM',exam.id,status);return json_({ok:true,message:status==='PUBLISHED'?'Tryout berhasil dipublikasikan.':'Status tryout diperbarui.'});
}

function handleStartExam_(b) {
  const a=authRequest_(b,['SISWA']); if(!a.ok) return authError_(a); if(!hasLearningAccess_(a.auth.user.id)) return json_({ok:false,message:'Masa aktif paket belajar belum tersedia atau sudah berakhir.'});
  const exam=findOne_('EXAMS','id',b.examId); if(!exam||String(exam.status)!=='PUBLISHED') return json_({ok:false,message:'Tryout belum tersedia.'});
  if(programIdsForUser_(a.auth.user).indexOf(String(exam.program_id))<0) return json_({ok:false,message:'Tryout tidak termasuk program Anda.'});
  const now=new Date();
  if(exam.start_at && new Date(exam.start_at)>now) return json_({ok:false,message:'Tryout belum dimulai.'});
  if(exam.end_at && new Date(exam.end_at)<now) return json_({ok:false,message:'Masa tryout sudah berakhir.'});
  const previous=getRows_('ATTEMPTS').find(x=>String(x.exam_id)===String(exam.id)&&String(x.student_user_id)===String(a.auth.user.id)&&String(x.status)==='SUBMITTED');
  if(previous) return json_({ok:false,message:'Tryout ini sudah pernah Anda selesaikan.'});
  const old=getRows_('ATTEMPTS').find(x=>String(x.exam_id)===String(exam.id)&&String(x.student_user_id)===String(a.auth.user.id)&&String(x.status)==='IN_PROGRESS');
  const attemptId=old?String(old.id):id_('ATM'),startedAt=old?String(old.started_at):now_();
  if(!old) appendObject_('ATTEMPTS',{id:attemptId,exam_id:exam.id,student_user_id:a.auth.user.id,started_at:startedAt,submitted_at:'',score:'',correct_count:'',wrong_count:'',status:'IN_PROGRESS'});
  const expiresAt=new Date(new Date(startedAt).getTime()+(Number(exam.duration_minutes)||60)*60000).toISOString();
  const qmap=indexBy_(getRows_('QUESTIONS'),'id');
  const questions=getRows_('EXAM_ITEMS').filter(x=>String(x.exam_id)===String(exam.id)).sort((x,y)=>Number(x.order_no)-Number(y.order_no)).map(item=>{
    const q=qmap[String(item.question_id)]||{};
    return {id:String(q.id),subject:q.subject,topic:q.topic,question_text:q.question_text,option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,option_e:q.option_e,order_no:item.order_no,points:item.points};
  });
  if(!questions.length) return json_({ok:false,message:'Tryout belum memiliki soal.'});
  return json_({ok:true,message:old?'Tryout dilanjutkan.':'Tryout dimulai.',data:{attemptId:attemptId,exam:exam,questions:questions,startedAt:startedAt,expiresAt:expiresAt}});
}

function handleSubmitExam_(b) {
  const a=authRequest_(b,['SISWA']); if(!a.ok) return authError_(a); if(!hasLearningAccess_(a.auth.user.id)) return json_({ok:false,message:'Masa aktif paket belajar belum tersedia atau sudah berakhir.'});
  const attempt=findOne_('ATTEMPTS','id',b.attemptId);
  if(!attempt||String(attempt.student_user_id)!==String(a.auth.user.id)||String(attempt.status)!=='IN_PROGRESS') return json_({ok:false,message:'Attempt tidak valid atau sudah dikirim.'});
  const exam=findOne_('EXAMS','id',attempt.exam_id), items=getRows_('EXAM_ITEMS').filter(x=>String(x.exam_id)===String(attempt.exam_id)), qmap=indexBy_(getRows_('QUESTIONS'),'id');
  const answerMap={}; (Array.isArray(b.answers)?b.answers:[]).forEach(x=>answerMap[String(x.questionId)]=String(x.answer||'').toUpperCase());
  let correct=0,wrong=0,totalPoints=0,earned=0; const analysis={},review=[];
  items.forEach(item=>{
    const q=qmap[String(item.question_id)]||{}, ans=answerMap[String(q.id)]||'', key=String(q.correct_answer||'').toUpperCase(), isCorrect=ans!==''&&ans===key, points=Number(item.points)||1;
    totalPoints+=points; if(isCorrect){correct++;earned+=points}else wrong++;
    const topic=String(q.topic||q.subject||'Lainnya'); if(!analysis[topic])analysis[topic]={correct:0,total:0,accuracy:0}; analysis[topic].total++; if(isCorrect)analysis[topic].correct++;
    appendObject_('ANSWERS',{id:id_('ANS'),attempt_id:attempt.id,question_id:q.id,answer:ans,is_correct:isCorrect?'TRUE':'FALSE',points:isCorrect?points:0,answered_at:now_()});
    review.push({questionId:String(q.id),questionText:String(q.question_text||''),answer:ans,correctAnswer:key,isCorrect:isCorrect,explanation:String(q.explanation||''),topic:topic});
  });
  Object.keys(analysis).forEach(k=>analysis[k].accuracy=Math.round(analysis[k].correct/analysis[k].total*100));
  const score=totalPoints?Math.round(earned/totalPoints*10000)/100:0;
  updateRowById_('ATTEMPTS',attempt.id,{submitted_at:now_(),score:score,correct_count:correct,wrong_count:wrong,status:'SUBMITTED'});
  const result={id:id_('RES'),student_user_id:a.auth.user.id,exam_id:exam.id,score:score,rank:'',percentile:'',analysis_json:JSON.stringify(analysis),published_at:now_()};
  appendObject_('RESULTS',result);
  const same=getRows_('RESULTS').filter(x=>String(x.exam_id)===String(exam.id)).sort((x,y)=>Number(y.score)-Number(x.score));
  const rank=same.findIndex(x=>String(x.id)===String(result.id))+1,total=same.length,percentile=Math.round(((total-rank+1)/total)*100);
  updateRowById_('RESULTS',result.id,{rank:rank,percentile:percentile});
  notifyGuardiansForStudent_(a.auth.user.id,'TRYOUT','Hasil tryout '+a.auth.user.name,'Skor '+String(exam.title||'tryout')+': '+score+', rank #'+rank+'.','/dashboard/orangtua/perkembangan','RESULT-'+result.id);
  return json_({ok:true,message:'Tryout selesai. Skor Anda '+score+'.',data:{score:score,correctCount:correct,wrongCount:wrong,rank:rank,percentile:percentile,analysis:analysis,review:review}});
}

function handleListResults_(b) {
  const a=authRequest_(b,['ADMIN','SISWA']); if(!a.ok) return authError_(a);
  const exams=indexBy_(getRows_('EXAMS'),'id'),users=indexBy_(getRows_('USERS'),'id');
  let rows=getRows_('RESULTS'); if(String(a.auth.user.role)==='SISWA') rows=rows.filter(x=>String(x.student_user_id)===String(a.auth.user.id));
  rows=rows.map(x=>Object.assign({},x,{exam_title:(exams[String(x.exam_id)]||{}).title||'',student_name:(users[String(x.student_user_id)]||{}).name||''}));
  rows.sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));
  return json_({ok:true,data:rows});
}

function handleRanking_(b) {
  const a=authRequest_(b,['SISWA']); if(!a.ok) return authError_(a);
  let my=getRows_('RESULTS').filter(x=>String(x.student_user_id)===String(a.auth.user.id)); my.sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));
  if(!my.length) return json_({ok:true,data:[]});
  const examId=String(b.examId||my[0].exam_id),users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('RESULTS').filter(x=>String(x.exam_id)===examId).sort((x,y)=>Number(y.score)-Number(x.score)).slice(0,100).map((x,i)=>({rank:i+1,name:(users[String(x.student_user_id)]||{}).name||'Siswa Nalarva',score:Number(x.score),is_me:String(x.student_user_id)===String(a.auth.user.id)}));
  return json_({ok:true,data:rows});
}






/* =========================================================
 * PARENT / GUARDIAN PORTAL v8
 * ========================================================= */

function guardianStudentIds_(guardianUserId){
  return unique_(getRows_('GUARDIANS').filter(g=>String(g.guardian_user_id)===String(guardianUserId)&&String(g.status)==='ACTIVE').map(g=>String(g.student_user_id)));
}
function linkedStudentForParent_(guardianUserId,studentUserId){
  const ids=guardianStudentIds_(guardianUserId),id=String(studentUserId||ids[0]||'');
  if(!id||ids.indexOf(id)<0)return null;
  const user=findOne_('USERS','id',id),student=findOne_('STUDENTS','user_id',id);
  if(!user||!student)return null;
  const program=findOne_('PROGRAMS','id',student.program_id)||{};
  return Object.assign({},student,{id:id,name:user.name,email:user.email,program_name:program.name||''});
}
function guardiansForStudent_(studentUserId){
  const users=indexBy_(getRows_('USERS'),'id');
  return getRows_('GUARDIANS').filter(g=>String(g.student_user_id)===String(studentUserId)&&String(g.status)==='ACTIVE').map(g=>Object.assign({},g,{user:users[String(g.guardian_user_id)]||{}})).filter(g=>g.user&&String(g.user.status)==='ACTIVE');
}
function notifyGuardiansForStudent_(studentUserId,type,title,message,link,entityKey){
  guardiansForStudent_(studentUserId).forEach(g=>notifyUser_(g.guardian_user_id,type,title,message,link,'GUARD-'+entityKey+'-'+g.guardian_user_id,true));
}

function handleAdminListGuardians_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id'),students=indexBy_(getRows_('STUDENTS'),'user_id');
  const rows=getRows_('GUARDIANS').map(g=>{
    const gu=users[String(g.guardian_user_id)]||{},su=users[String(g.student_user_id)]||{},sp=students[String(g.student_user_id)]||{};
    return {link_id:g.id,guardian_user_id:g.guardian_user_id,guardian_name:gu.name||'',guardian_email:gu.email||'',guardian_status:gu.status||'',student_user_id:g.student_user_id,student_name:su.name||'',student_no:sp.student_no||'',level:sp.level||'',relation:g.relation||'',phone:g.phone||'',link_status:g.status||''};
  }).sort((x,y)=>String(x.guardian_name).localeCompare(String(y.guardian_name)));
  return json_({ok:true,data:rows});
}
function handleAdminCreateGuardian_(b){
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const studentUserId=clean_(b.studentUserId,80),studentUser=findOne_('USERS','id',studentUserId),student=findOne_('STUDENTS','user_id',studentUserId);
  if(!studentUser||!student||String(studentUser.role)!=='SISWA')return json_({ok:false,message:'Siswa tidak ditemukan.'});
  const email=clean_(b.email,180).toLowerCase(),name=clean_(b.name,120),phone=clean_(b.phone,40),relation=clean_(b.relation,40)||'ORANG_TUA';
  if(!email||!name)return json_({ok:false,message:'Nama dan email orang tua/wali wajib diisi.'});
  let guardian=findOne_('USERS','email',email),temporaryPassword='';
  if(guardian&&String(guardian.role)!=='ORANG_TUA')return json_({ok:false,message:'Email tersebut sudah digunakan oleh role lain.'});
  if(!guardian){
    temporaryPassword=tempPassword_();
    guardian=createUser(email,temporaryPassword,'ORANG_TUA',name);
  }else if(String(guardian.name)!==name)updateRowById_('USERS',guardian.id,{name:name,updated_at:now_()});
  let link=getRows_('GUARDIANS').find(g=>String(g.guardian_user_id)===String(guardian.id)&&String(g.student_user_id)===studentUserId);
  if(link)updateRowById_('GUARDIANS',link.id,{relation:relation,phone:phone,status:'ACTIVE'});
  else{link={id:id_('GUA'),guardian_user_id:guardian.id,student_user_id:studentUserId,relation:relation,phone:phone,status:'ACTIVE',created_at:now_()};appendObject_('GUARDIANS',link);}
  updateRowById_('STUDENTS',student.id,{parent_name:name,parent_phone:phone,parent_email:email,guardian_relation:relation});
  const credential=temporaryPassword?('\\nEmail login: '+email+'\\nPassword sementara: '+temporaryPassword):'';
  emailSafe_(email,'Akses Portal Orang Tua Nalarva','Akun Anda telah dihubungkan dengan siswa '+studentUser.name+'. Gunakan Portal Orang Tua untuk melihat perkembangan belajar, kehadiran, dan hasil tryout.'+credential,siteUrl_()+'/login','GUARDIAN-'+link.id);
  createInAppNotification_(guardian.id,'AKUN','Portal Orang Tua aktif','Akun Anda telah dihubungkan dengan '+studentUser.name+'.','/dashboard/orangtua','GUARDIAN-LINK-'+link.id);
  audit_(a.auth.user.id,'CREATE','GUARDIAN_LINK',link.id,email+' -> '+studentUser.email);
  return json_({ok:true,message:temporaryPassword?'Akun orang tua/wali berhasil dibuat dan dihubungkan.':'Akun orang tua/wali yang sudah ada berhasil dihubungkan ke siswa.',data:{guardianUserId:guardian.id,temporaryPassword:temporaryPassword}});
}
function handleParentChildren_(b){
  const a=authRequest_(b,['ORANG_TUA']);if(!a.ok)return authError_(a);
  const rows=guardianStudentIds_(a.auth.user.id).map(id=>linkedStudentForParent_(a.auth.user.id,id)).filter(Boolean);
  return json_({ok:true,data:rows});
}

function parentAttendanceRows_(studentUserId){
  const schedules=indexBy_(getRows_('SCHEDULES'),'id'),classes=indexBy_(getRows_('CLASSES'),'id');
  return getRows_('ATTENDANCE').filter(x=>String(x.student_user_id)===String(studentUserId)).map(x=>{
    const s=schedules[String(x.schedule_id)]||{},c=classes[String(s.class_id)]||{};
    return Object.assign({},x,{schedule_title:s.title||'',start_at:s.start_at||x.checkin_at||'',class_name:c.name||''});
  }).sort((x,y)=>String(y.start_at).localeCompare(String(x.start_at)));
}
function parentResultRows_(studentUserId){
  const exams=indexBy_(getRows_('EXAMS'),'id');
  return getRows_('RESULTS').filter(x=>String(x.student_user_id)===String(studentUserId)).map(x=>Object.assign({},x,{exam_title:(exams[String(x.exam_id)]||{}).title||'Tryout Nalarva'})).sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));
}
function parentAssignmentRows_(studentUserId){
  const assignments=indexBy_(getRows_('ASSIGNMENTS'),'id'),classes=indexBy_(getRows_('CLASSES'),'id');
  return getRows_('SUBMISSIONS').filter(x=>String(x.student_user_id)===String(studentUserId)).map(x=>{
    const asg=assignments[String(x.assignment_id)]||{},cls=classes[String(asg.class_id)]||{};
    return Object.assign({},x,{assignment_title:asg.title||'',class_name:cls.name||'',due_at:asg.due_at||''});
  }).sort((x,y)=>String(y.submitted_at).localeCompare(String(x.submitted_at)));
}
function handleParentOverview_(b){
  const a=authRequest_(b,['ORANG_TUA']);if(!a.ok)return authError_(a);
  const student=linkedStudentForParent_(a.auth.user.id,b.studentUserId);if(!student)return json_({ok:false,message:'Siswa tidak terhubung dengan akun Anda.'});
  const att=parentAttendanceRows_(student.id),hadir=att.filter(x=>String(x.status)==='HADIR').length,attendanceRate=att.length?Math.round(hadir/att.length*100):0;
  const results=parentResultRows_(student.id),avgExam=results.length?Math.round(results.reduce((s,x)=>s+Number(x.score||0),0)/results.length*10)/10:null;
  const classIds=getRows_('ENROLLMENTS').filter(x=>String(x.student_user_id)===String(student.id)&&String(x.status)==='ACTIVE').map(x=>String(x.class_id));
  const assignments=getRows_('ASSIGNMENTS').filter(x=>classIds.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED'),subs=parentAssignmentRows_(student.id),done=unique_(subs.filter(x=>['SUBMITTED','GRADED'].indexOf(String(x.status))>=0).map(x=>String(x.assignment_id))).length;
  const progress=assignments.length?Math.round(done/assignments.length*100):0;
  return json_({ok:true,data:{student:student,attendanceRate:attendanceRate,attendanceCount:att.length,averageExamScore:avgExam,examCount:results.length,assignmentProgress:progress,pendingAssignments:Math.max(0,assignments.length-done),subscription:studentAccessData_(student.id),upcomingSchedules:upcomingSchedulesForClasses_(classIds,5),recentResults:results.slice(0,5)}});
}
function handleParentAttendance_(b){
  const a=authRequest_(b,['ORANG_TUA']);if(!a.ok)return authError_(a);
  const student=linkedStudentForParent_(a.auth.user.id,b.studentUserId);if(!student)return json_({ok:false,message:'Siswa tidak terhubung dengan akun Anda.'});
  return json_({ok:true,data:parentAttendanceRows_(student.id)});
}
function handleParentProgressReport_(b){
  const a=authRequest_(b,['ORANG_TUA']);if(!a.ok)return authError_(a);
  const student=linkedStudentForParent_(a.auth.user.id,b.studentUserId);if(!student)return json_({ok:false,message:'Siswa tidak terhubung dengan akun Anda.'});
  const att=parentAttendanceRows_(student.id),hadir=att.filter(x=>String(x.status)==='HADIR').length,attendanceRate=att.length?Math.round(hadir/att.length*100):0;
  const results=parentResultRows_(student.id),assignments=parentAssignmentRows_(student.id),graded=assignments.filter(x=>String(x.score)!=='');
  const classIds=getRows_('ENROLLMENTS').filter(x=>String(x.student_user_id)===String(student.id)&&String(x.status)==='ACTIVE').map(x=>String(x.class_id)),allAssignments=getRows_('ASSIGNMENTS').filter(x=>classIds.indexOf(String(x.class_id))>=0&&String(x.status)==='PUBLISHED');
  const done=unique_(assignments.filter(x=>['SUBMITTED','GRADED'].indexOf(String(x.status))>=0).map(x=>String(x.assignment_id))).length;
  const summary={attendanceRate:attendanceRate,assignmentProgress:allAssignments.length?Math.round(done/allAssignments.length*100):0,assignmentAverage:graded.length?Math.round(graded.reduce((s,x)=>s+Number(x.score||0),0)/graded.length*10)/10:null,examAverage:results.length?Math.round(results.reduce((s,x)=>s+Number(x.score||0),0)/results.length*10)/10:null};
  const dates=[].concat(results.map(x=>x.published_at),assignments.map(x=>x.submitted_at),att.map(x=>x.start_at)).filter(Boolean).map(x=>new Date(x)).sort((x,y)=>x-y);
  return json_({ok:true,data:{student:student,periodStart:dates.length?dates[0].toISOString():now_(),periodEnd:now_(),summary:summary,results:results,assignments:assignments}});
}
function handleParentTranscript_(b){
  const a=authRequest_(b,['ORANG_TUA']);if(!a.ok)return authError_(a);
  const student=linkedStudentForParent_(a.auth.user.id,b.studentUserId);if(!student)return json_({ok:false,message:'Siswa tidak terhubung dengan akun Anda.'});
  const assignments=parentAssignmentRows_(student.id).filter(x=>String(x.status)==='GRADED'&&String(x.score)!=='');
  const documentNo='NV-TRX-'+Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy')+'-'+String(student.student_no||student.id).replace(/[^A-Za-z0-9]/g,'').slice(-8);
  return json_({ok:true,data:{student:student,generatedAt:now_(),documentNo:documentNo,results:parentResultRows_(student.id),assignments:assignments}});
}

/* =========================================================
 * STUDENT EXPERIENCE v7
 * Profile, academic calendar, tutor-student messages, certificates
 * ========================================================= */

function roleClassIds_(user) {
  if(String(user.role)==='ADMIN')return getRows_('CLASSES').map(x=>String(x.id));
  if(String(user.role)==='TUTOR')return getRows_('CLASSES').filter(x=>String(x.tutor_user_id)===String(user.id)).map(x=>String(x.id));
  if(String(user.role)==='ORANG_TUA'){const ids=guardianStudentIds_(user.id);return unique_(getRows_('ENROLLMENTS').filter(x=>ids.indexOf(String(x.student_user_id))>=0&&String(x.status)==='ACTIVE').map(x=>String(x.class_id)));}
  return getRows_('ENROLLMENTS').filter(x=>String(x.student_user_id)===String(user.id)&&String(x.status)==='ACTIVE').map(x=>String(x.class_id));
}

function handleListCalendarEvents_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const classes=indexBy_(getRows_('CLASSES'),'id'),programs=indexBy_(getRows_('PROGRAMS'),'id'),classIds=roleClassIds_(a.auth.user);
  let programIds=[];
  if(String(a.auth.user.role)==='SISWA'){const s=findOne_('STUDENTS','user_id',a.auth.user.id);if(s&&s.program_id)programIds.push(String(s.program_id));}
  if(String(a.auth.user.role)==='TUTOR')programIds=classIds.map(id=>String((classes[id]||{}).program_id||'')).filter(Boolean);
  if(String(a.auth.user.role)==='ORANG_TUA')guardianStudentIds_(a.auth.user.id).forEach(uid=>{const s=findOne_('STUDENTS','user_id',uid);if(s&&s.program_id)programIds.push(String(s.program_id))});
  programIds=unique_(programIds);
  const rows=getRows_('CALENDAR_EVENTS').filter(x=>{
    if(String(x.status)!=='ACTIVE')return false;
    if(String(a.auth.user.role)==='ADMIN')return true;
    if(x.class_id)return classIds.indexOf(String(x.class_id))>=0;
    if(x.program_id)return programIds.indexOf(String(x.program_id))>=0;
    return true;
  }).map(x=>Object.assign({},x,{class_name:(classes[String(x.class_id)]||{}).name||'',program_name:(programs[String(x.program_id)]||{}).name||''}));
  return json_({ok:true,data:rows});
}

function handleAdminCreateCalendarEvent_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const title=clean_(b.title,180),start=clean_(b.startAt,50),end=clean_(b.endAt,50);
  if(!title||!start||!end)return json_({ok:false,message:'Judul, waktu mulai, dan selesai wajib diisi.'});
  if(new Date(end)<=new Date(start))return json_({ok:false,message:'Waktu selesai harus setelah waktu mulai.'});
  const programId=clean_(b.programId,80),classId=clean_(b.classId,80);
  if(programId&&!findOne_('PROGRAMS','id',programId))return json_({ok:false,message:'Program tidak ditemukan.'});
  if(classId&&!findOne_('CLASSES','id',classId))return json_({ok:false,message:'Kelas tidak ditemukan.'});
  const row={id:id_('CAL'),program_id:programId,class_id:classId,title:title,description:clean_(b.description,1200),type:clean_(b.type,40)||'INFO',start_at:new Date(start).toISOString(),end_at:new Date(end).toISOString(),status:'ACTIVE',created_by:a.auth.user.id,created_at:now_()};
  appendObject_('CALENDAR_EVENTS',row);
  const targetUsers={};
  if(classId)getRows_('ENROLLMENTS').filter(e=>String(e.class_id)===String(classId)&&String(e.status)==='ACTIVE').forEach(e=>targetUsers[String(e.student_user_id)]=true);
  if(classId){const cls=findOne_('CLASSES','id',classId);if(cls&&cls.tutor_user_id)targetUsers[String(cls.tutor_user_id)]=true;}
  Object.keys(targetUsers).forEach(uid=>notifyUser_(uid,'KALENDER','Agenda baru: '+title,clean_(b.description,500)||'Ada agenda baru di kalender Nalarva.','/dashboard/'+(String((findOne_('USERS','id',uid)||{}).role)==='TUTOR'?'tutor':'siswa')+'/kalender','CAL-'+row.id,false));
  audit_(a.auth.user.id,'CREATE','CALENDAR_EVENT',row.id,title);
  return json_({ok:true,message:'Agenda kalender berhasil ditambahkan.',data:row});
}

function relatedMessageUsers_(user) {
  const out={},users=indexBy_(getRows_('USERS'),'id'),classes=getRows_('CLASSES'),enr=getRows_('ENROLLMENTS').filter(x=>String(x.status)==='ACTIVE');
  if(String(user.role)==='TUTOR'){
    const ids=classes.filter(c=>String(c.tutor_user_id)===String(user.id)).map(c=>String(c.id));
    const studentIds=[];
    enr.filter(e=>ids.indexOf(String(e.class_id))>=0).forEach(e=>{studentIds.push(String(e.student_user_id));const u=users[String(e.student_user_id)];if(u)out[u.id]={id:u.id,name:u.name,role:u.role,role_label:'Siswa'}});
    getRows_('GUARDIANS').filter(g=>studentIds.indexOf(String(g.student_user_id))>=0&&String(g.status)==='ACTIVE').forEach(g=>{const u=users[String(g.guardian_user_id)];if(u&&String(u.status)==='ACTIVE')out[u.id]={id:u.id,name:u.name,role:u.role,role_label:'Orang Tua / Wali'}});
  }else if(String(user.role)==='SISWA'){
    const ids=enr.filter(e=>String(e.student_user_id)===String(user.id)).map(e=>String(e.class_id));
    classes.filter(c=>ids.indexOf(String(c.id))>=0&&c.tutor_user_id).forEach(c=>{const u=users[String(c.tutor_user_id)];if(u)out[u.id]={id:u.id,name:u.name,role:u.role,role_label:'Tutor · '+c.name}});
  }else if(String(user.role)==='ORANG_TUA'){
    const studentIds=guardianStudentIds_(user.id),ids=enr.filter(e=>studentIds.indexOf(String(e.student_user_id))>=0).map(e=>String(e.class_id));
    classes.filter(c=>ids.indexOf(String(c.id))>=0&&c.tutor_user_id).forEach(c=>{const u=users[String(c.tutor_user_id)];if(u)out[u.id]={id:u.id,name:u.name,role:u.role,role_label:'Tutor · '+c.name}});
  }
  return Object.keys(out).map(k=>out[k]);
}

function handleMessageRecipients_(b) {
  const a=authRequest_(b,['TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  return json_({ok:true,data:relatedMessageUsers_(a.auth.user)});
}
function handleListMessages_(b) {
  const a=authRequest_(b,['TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id');
  const rows=getRows_('MESSAGES').filter(x=>String(x.sender_user_id)===String(a.auth.user.id)||String(x.recipient_user_id)===String(a.auth.user.id)).sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))).slice(0,200).map(x=>{
    const outgoing=String(x.sender_user_id)===String(a.auth.user.id),otherId=outgoing?String(x.recipient_user_id):String(x.sender_user_id),other=users[otherId]||{};
    return Object.assign({},x,{direction:outgoing?'OUT':'IN',other_user_id:otherId,other_name:other.name||other.email||'Pengguna Nalarva'});
  });
  return json_({ok:true,data:rows});
}
function handleSendMessage_(b) {
  const a=authRequest_(b,['TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  if(!rateLimit_('MESSAGE',a.auth.user.id,30,10*60).ok)return json_({ok:false,message:'Pesan dikirim terlalu cepat. Coba lagi beberapa saat.'});
  const recipient=clean_(b.recipientUserId,80),allowed=relatedMessageUsers_(a.auth.user).some(x=>String(x.id)===recipient);
  if(!allowed)return json_({ok:false,message:'Penerima tidak terhubung dengan kelas Anda.'});
  const subject=clean_(b.subject,180),message=clean_(b.message,1500);
  if(!subject||!message)return json_({ok:false,message:'Subjek dan pesan wajib diisi.'});
  const row={id:id_('MSG'),sender_user_id:a.auth.user.id,recipient_user_id:recipient,class_id:'',subject:subject,message:message,status:'SENT',created_at:now_(),read_at:''};
  appendObject_('MESSAGES',row);
  const role=String((findOne_('USERS','id',recipient)||{}).role),link=role==='TUTOR'?'/dashboard/tutor/pesan':role==='ORANG_TUA'?'/dashboard/orangtua/pesan':'/dashboard/siswa/pesan';
  notifyUser_(recipient,'PESAN','Pesan baru dari '+a.auth.user.name,subject,link,'MSG-'+row.id,false);
  return json_({ok:true,message:'Pesan berhasil dikirim.',data:row});
}
function handleMarkMessageRead_(b) {
  const a=authRequest_(b,['TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const m=findOne_('MESSAGES','id',b.messageId);
  if(!m||String(m.recipient_user_id)!==String(a.auth.user.id))return json_({ok:false,message:'Pesan tidak ditemukan.'});
  updateRowById_('MESSAGES',m.id,{status:'READ',read_at:now_()});
  return json_({ok:true});
}

function handleStudentProfile_(b) {
  const a=authRequest_(b,['SISWA']);if(!a.ok)return authError_(a);
  const s=findOne_('STUDENTS','user_id',a.auth.user.id);if(!s)return json_({ok:false,message:'Profil siswa tidak ditemukan.'});
  const p=findOne_('PROGRAMS','id',s.program_id)||{};
  return json_({ok:true,data:Object.assign({},s,{name:a.auth.user.name,email:a.auth.user.email,program_name:p.name||''})});
}
function handleUpdateStudentProfile_(b) {
  const a=authRequest_(b,['SISWA']);if(!a.ok)return authError_(a);
  const s=findOne_('STUDENTS','user_id',a.auth.user.id);if(!s)return json_({ok:false,message:'Profil siswa tidak ditemukan.'});
  const name=clean_(b.name,120);if(!name)return json_({ok:false,message:'Nama siswa wajib diisi.'});
  updateRowById_('USERS',a.auth.user.id,{name:name,updated_at:now_()});
  updateRowById_('STUDENTS',s.id,{
    student_phone:clean_(b.studentPhone,40),birth_date:clean_(b.birthDate,20),grade:clean_(b.grade,20),school:clean_(b.school,160),
    city:clean_(b.city,120),address:clean_(b.address,500),parent_name:clean_(b.parentName,120),parent_phone:clean_(b.parentPhone,40),
    parent_email:clean_(b.parentEmail,180).toLowerCase(),guardian_relation:clean_(b.guardianRelation,40)
  });
  audit_(a.auth.user.id,'UPDATE','STUDENT_PROFILE',s.id,'Memperbarui profil siswa');
  return handleStudentProfile_(b);
}

function certificateNo_() {
  const year=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyy'),n=getRows_('CERTIFICATES').length+1;
  return 'NV-CERT-'+year+'-'+String(n).padStart(5,'0');
}
function ensureCertificateForResult_(result,user,exam) {
  let c=findOne_('CERTIFICATES','result_id',result.id);if(c)return c;
  const code=Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
  c={id:id_('CRT'),result_id:result.id,student_user_id:user.id,exam_id:result.exam_id,cert_no:certificateNo_(),verification_code:code,status:'ISSUED',issued_at:result.published_at||now_()};
  appendObject_('CERTIFICATES',c);return c;
}
function handleStudentCertificates_(b) {
  const a=authRequest_(b,['SISWA']);if(!a.ok)return authError_(a);
  const exams=indexBy_(getRows_('EXAMS'),'id');
  const results=getRows_('RESULTS').filter(x=>String(x.student_user_id)===String(a.auth.user.id)&&x.published_at).sort((x,y)=>String(y.published_at).localeCompare(String(x.published_at)));
  const rows=results.map(r=>{const exam=exams[String(r.exam_id)]||{},c=ensureCertificateForResult_(r,a.auth.user,exam);return Object.assign({},c,{student_name:a.auth.user.name,exam_title:exam.title||'Tryout Nalarva',score:r.score,rank:r.rank,percentile:r.percentile})});
  return json_({ok:true,data:rows});
}

/* =========================================================
 * NOTIFICATIONS & EMAIL v6
 * ========================================================= */

function escapeHtml_(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function currentSettings_(){return settingMap_();}
function siteUrl_(){return String(currentSettings_().SITE_URL||'https://nalarva.com').replace(/\/+$/,'');}

function emailHtml_(title,message,link) {
  const button=link?'<p style="margin:28px 0"><a href="'+escapeHtml_(link)+'" style="background:#10284c;color:#fff;text-decoration:none;padding:12px 18px;border-radius:9px;font-weight:700">Buka Nalarva</a></p>':'';
  return '<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#25344a">'+
    '<div style="padding:24px 0;border-bottom:1px solid #e8ebef"><b style="font-size:20px;color:#10284c">NALARVA</b></div>'+
    '<div style="padding:28px 0"><h2 style="margin:0 0 12px;font-size:24px;color:#10284c">'+escapeHtml_(title)+'</h2>'+
    '<p style="font-size:15px;line-height:1.7;color:#536071">'+escapeHtml_(message).replace(/\n/g,'<br>')+'</p>'+button+
    '<p style="font-size:12px;color:#8a93a0;margin-top:30px">Email otomatis dari Nalarva. Abaikan jika pesan ini tidak ditujukan untuk Anda.</p></div></div>';
}

function emailSafe_(email,title,message,link,entityKey) {
  email=clean_(email,180).toLowerCase(); if(!email)return {ok:false,reason:'no-email'};
  try{
    if(MailApp.getRemainingDailyQuota()<1)return {ok:false,reason:'quota'};
    const s=currentSettings_(),options={to:email,subject:title,htmlBody:emailHtml_(title,message,link),name:s.SENDER_NAME||'Nalarva'};
    if(s.REPLY_TO)options.replyTo=s.REPLY_TO;
    MailApp.sendEmail(options);
    appendObject_('NOTIFICATIONS',{id:id_('NOT'),user_id:'',email:email,type:'EMAIL',title:title,message:message,link:link||'',channel:'EMAIL',status:'SENT',entity_key:entityKey||'',created_at:now_(),read_at:'',sent_at:now_()});
    return {ok:true};
  }catch(err){
    appendObject_('NOTIFICATIONS',{id:id_('NOT'),user_id:'',email:email,type:'EMAIL',title:title,message:message,link:link||'',channel:'EMAIL',status:'FAILED',entity_key:entityKey||'',created_at:now_(),read_at:'',sent_at:''});
    return {ok:false,reason:String(err)};
  }
}

function createInAppNotification_(userId,type,title,message,link,entityKey) {
  if(!userId)return null;
  if(entityKey && getRows_('NOTIFICATIONS').find(x=>String(x.user_id)===String(userId)&&String(x.entity_key)===String(entityKey)&&String(x.channel)==='IN_APP'))return null;
  const row={id:id_('NOT'),user_id:userId,email:'',type:type||'INFO',title:clean_(title,180),message:clean_(message,1200),link:clean_(link,300),channel:'IN_APP',status:'UNREAD',entity_key:clean_(entityKey,180),created_at:now_(),read_at:'',sent_at:''};
  appendObject_('NOTIFICATIONS',row);return row;
}

function notifyUser_(userId,type,title,message,link,entityKey,sendEmail) {
  const n=createInAppNotification_(userId,type,title,message,link,entityKey);
  if(sendEmail){
    const u=findOne_('USERS','id',userId);
    if(u&&u.email)emailSafe_(u.email,title,message,link?siteUrl_()+link:'',entityKey);
  }
  return n;
}

function notifyAdmins_(type,title,message,link,entityKey) {
  getRows_('USERS').filter(x=>String(x.role)==='ADMIN'&&String(x.status)==='ACTIVE').forEach(u=>createInAppNotification_(u.id,type,title,message,link,entityKey));
  const email=String(currentSettings_().ADMIN_NOTIFICATION_EMAIL||'').toLowerCase();
  if(email)emailSafe_(email,title,message,link?siteUrl_()+link:'',entityKey);
}

function handleListNotifications_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const rows=getRows_('NOTIFICATIONS').filter(x=>String(x.user_id)===String(a.auth.user.id)&&String(x.channel)==='IN_APP').sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at))).slice(0,100);
  return json_({ok:true,data:rows});
}
function handleNotificationCount_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const unread=getRows_('NOTIFICATIONS').filter(x=>String(x.user_id)===String(a.auth.user.id)&&String(x.channel)==='IN_APP'&&!x.read_at).length;
  return json_({ok:true,data:{unread:unread}});
}
function handleMarkNotificationRead_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  const n=findOne_('NOTIFICATIONS','id',b.notificationId);
  if(!n||String(n.user_id)!==String(a.auth.user.id))return json_({ok:false,message:'Notifikasi tidak ditemukan.'});
  updateRowById_('NOTIFICATIONS',n.id,{status:'READ',read_at:now_()});
  return json_({ok:true,message:'Notifikasi ditandai dibaca.'});
}
function handleMarkAllNotificationsRead_(b) {
  const a=authRequest_(b,['ADMIN','TUTOR','SISWA','ORANG_TUA']);if(!a.ok)return authError_(a);
  getRows_('NOTIFICATIONS').filter(x=>String(x.user_id)===String(a.auth.user.id)&&String(x.channel)==='IN_APP'&&!x.read_at).forEach(n=>updateRowById_('NOTIFICATIONS',n.id,{status:'READ',read_at:now_()}));
  return json_({ok:true,message:'Semua notifikasi ditandai dibaca.'});
}

function ensureMaintenanceTriggers_() {
  const triggers=ScriptApp.getProjectTriggers();
  triggers.filter(t=>t.getHandlerFunction()==='sendSubscriptionRemindersDaily').forEach(t=>ScriptApp.deleteTrigger(t));
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='runNalarvaMaintenanceDaily')){
    ScriptApp.newTrigger('runNalarvaMaintenanceDaily').timeBased().everyDays(1).atHour(7).create();
  }
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='createDatabaseBackupWeekly')){
    ScriptApp.newTrigger('createDatabaseBackupWeekly').timeBased().everyWeeks(1).onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(2).create();
  }
}
function runNalarvaMaintenanceDaily(){
  const expired=cleanupExpiredSessions_();
  const reminders=sendSubscriptionRemindersDaily();
  return {ok:true,expiredSessions:expired,reminders:reminders};
}


function sendSubscriptionRemindersDaily() {
  const users=indexBy_(getRows_('USERS'),'id'),packages=indexBy_(getRows_('PACKAGES'),'id'),programs=indexBy_(getRows_('PROGRAMS'),'id');
  const now=new Date(),targets=[7,3,1,0];
  getRows_('SUBSCRIPTIONS').filter(s=>String(s.status)==='ACTIVE'&&s.end_at).forEach(s=>{
    const end=new Date(s.end_at),days=Math.ceil((end.getTime()-now.getTime())/(24*60*60*1000));
    if(targets.indexOf(days)<0)return;
    const u=users[String(s.user_id)];if(!u)return;
    const pkg=packages[String(s.package_id)]||{},pr=programs[String(s.program_id)]||{};
    const title=days>0?'Paket Nalarva akan berakhir':'Masa aktif paket Nalarva berakhir hari ini';
    const message=days>0?('Masa aktif '+String(pkg.name||'paket belajar')+' untuk '+String(pr.name||'program Nalarva')+' akan berakhir dalam '+days+' hari.'):('Masa aktif '+String(pkg.name||'paket belajar')+' berakhir hari ini. Hubungi Admin Nalarva jika ingin melanjutkan.');
    const key='SUB-REMINDER-'+s.id+'-'+Utilities.formatDate(end,Session.getScriptTimeZone()||'Asia/Jakarta','yyyyMMdd')+'-'+days;
    notifyUser_(u.id,'LANGGANAN',title,message,'/dashboard/siswa/langganan',key,true);
    notifyGuardiansForStudent_(u.id,'LANGGANAN',title,message,'/dashboard/orangtua','PARENT-'+key);
  });
  return {ok:true,remainingEmailQuota:MailApp.getRemainingDailyQuota()};
}

/* =========================================================
 * BILLING, INVOICE, PAYMENT PROOF & SUBSCRIPTION v5
 * ========================================================= */

function nextInvoiceNo_() {
  const ym=Utilities.formatDate(new Date(),Session.getScriptTimeZone()||'Asia/Jakarta','yyyyMM');
  let n=getRows_('ORDERS').length+1,no='';
  do { no='NV-INV-'+ym+'-'+String(n++).padStart(4,'0'); } while(findOne_('ORDERS','invoice_no',no));
  return no;
}

function settingMap_() {
  const out={};getRows_('SETTINGS').forEach(x=>out[String(x.key)]=String(x.value||''));return out;
}
function upsertSetting_(key,value,description) {
  const row=findOne_('SETTINGS','key',key);
  if(row) {
    const sh=db_().getSheetByName('SETTINGS'),headers=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String),keys=sh.getRange(2,1,Math.max(0,sh.getLastRow()-1),1).getValues().flat().map(String),idx=keys.indexOf(String(key));
    if(idx>=0){const r=idx+2;[['value',value],['description',description],['updated_at',now_()]].forEach(pair=>{const c=headers.indexOf(pair[0]);if(c>=0)sh.getRange(r,c+1).setValue(safeCell_(pair[1]))});}
  } else appendObject_('SETTINGS',{key:key,value:value,description:description,updated_at:now_()});
}

function seedPaymentSettings_() {
  [
    ['BANK_NAME','','Nama bank penerima pembayaran'],
    ['BANK_ACCOUNT','','Nomor rekening penerima'],
    ['BANK_HOLDER','','Nama pemilik rekening'],
    ['PAYMENT_NOTE','Hubungi Admin Nalarva untuk detail pembayaran.','Catatan yang tampil pada invoice'],
    ['SITE_URL','https://nalarva.com','Alamat publik website Nalarva'],
    ['SENDER_NAME','Nalarva','Nama pengirim email'],
    ['REPLY_TO','','Alamat email untuk balasan'],
    ['ADMIN_NOTIFICATION_EMAIL','','Email penerima notifikasi operasional Admin']
  ].forEach(x=>{if(!findOne_('SETTINGS','key',x[0]))appendObject_('SETTINGS',{key:x[0],value:x[1],description:x[2],updated_at:now_()})});
}

function paymentPublicSettings_() {
  const s=settingMap_();
  return {bankName:s.BANK_NAME||'',bankAccount:s.BANK_ACCOUNT||'',bankHolder:s.BANK_HOLDER||'',paymentNote:s.PAYMENT_NOTE||'',siteUrl:s.SITE_URL||'https://nalarva.com',senderName:s.SENDER_NAME||'Nalarva',replyTo:s.REPLY_TO||'',adminNotificationEmail:s.ADMIN_NOTIFICATION_EMAIL||''};
}

function handleLookupInvoice_(b) {
  const invoiceNo=clean_(b.invoiceNo,80).toUpperCase(),email=clean_(b.email,180).toLowerCase();
  if(!invoiceNo||!email)return json_({ok:false,message:'Nomor invoice dan email wajib diisi.'});
  const order=findOne_('ORDERS','invoice_no',invoiceNo);if(!order)return json_({ok:false,message:'Invoice tidak ditemukan.'});
  const reg=findOne_('REGISTRATIONS','id',order.registration_id);
  if(!reg||String(reg.email).toLowerCase()!==email)return json_({ok:false,message:'Invoice tidak cocok dengan email pendaftaran.'});
  const pkg=findOne_('PACKAGES','id',order.package_id)||{};
  const proof=getRows_('PAYMENTS').filter(x=>String(x.order_id)===String(order.id)&&x.proof_url).sort((a,b)=>String(b.submitted_at).localeCompare(String(a.submitted_at)))[0]||{};
  return json_({ok:true,data:{
    invoiceNo:String(order.invoice_no),status:String(order.status),amount:Number(order.amount||0),packageName:String(pkg.name||''),packageCode:String(pkg.code||''),
    registrationName:String(reg.name||''),registrationEmail:String(reg.email||''),level:String(reg.level||''),createdAt:String(order.created_at||''),dueAt:String(order.due_at||''),
    paymentMethod:String(order.payment_method||''),payment:paymentPublicSettings_(),proofStatus:String(proof.status||''),proofUrl:''
  }});
}

function handleSubmitPaymentProof_(b) {
  const invoiceNo=clean_(b.invoiceNo,80).toUpperCase(),email=clean_(b.email,180).toLowerCase();
  if(!rateLimit_('PAYMENT_PROOF',invoiceNo+'|'+email,5,60*60).ok)return json_({ok:false,message:'Terlalu banyak unggahan untuk invoice ini. Silakan coba kembali nanti.'});
  const order=findOne_('ORDERS','invoice_no',invoiceNo);if(!order)return json_({ok:false,message:'Invoice tidak ditemukan.'});
  const reg=findOne_('REGISTRATIONS','id',order.registration_id);
  if(!reg||String(reg.email).toLowerCase()!==email)return json_({ok:false,message:'Invoice tidak cocok dengan email pendaftaran.'});
  if(['PAID','ACTIVATED'].indexOf(String(order.status))>=0)return json_({ok:false,message:'Invoice ini sudah dibayar.'});
  const mime=clean_(b.mimeType,120).toLowerCase();
  if(['image/jpeg','image/png','application/pdf'].indexOf(mime)<0)return json_({ok:false,message:'Bukti harus berupa JPG, PNG, atau PDF.'});
  const file=savePrivateDataUrl_('Bukti Pembayaran',invoiceNo+'-'+safeFileName_(b.fileName),mime,b.base64);
  const row={id:id_('PAY'),order_id:order.id,amount:Number(order.amount||0),method:order.payment_method,reference:'',proof_file_id:file.getId(),proof_url:file.getUrl(),submitted_by:email,submitted_at:now_(),review_notes:'',status:'SUBMITTED',confirmed_by:'',confirmed_at:''};
  appendObject_('PAYMENTS',row);
  updateRowById_('ORDERS',order.id,{status:'BUKTI_DIKIRIM'});
  notifyAdmins_('PEMBAYARAN','Bukti pembayaran masuk','Bukti pembayaran untuk invoice '+invoiceNo+' telah dikirim dan menunggu verifikasi.','/dashboard/admin/pendaftaran','PROOF-'+row.id);
  emailSafe_(email,'Bukti pembayaran Nalarva diterima','Bukti pembayaran untuk invoice '+invoiceNo+' sudah kami terima dan sedang menunggu verifikasi Admin Nalarva.',siteUrl_()+'/pembayaran','PROOF-USER-'+row.id);
  return json_({ok:true,message:'Bukti pembayaran berhasil dikirim. Admin Nalarva akan melakukan verifikasi.'});
}

function handleAdminReviewPaymentProof_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const order=findOne_('ORDERS','id',b.orderId);if(!order)return json_({ok:false,message:'Tagihan tidak ditemukan.'});
  const proof=getRows_('PAYMENTS').filter(x=>String(x.order_id)===String(order.id)&&String(x.status)==='SUBMITTED').sort((x,y)=>String(y.submitted_at).localeCompare(String(x.submitted_at)))[0];
  if(!proof)return json_({ok:false,message:'Tidak ada bukti pembayaran yang menunggu verifikasi.'});
  const decision=clean_(b.decision,20).toUpperCase();
  if(decision==='APPROVE'){
    const at=now_();
    updateRowById_('PAYMENTS',proof.id,{status:'CONFIRMED',review_notes:clean_(b.notes,500),confirmed_by:a.auth.user.id,confirmed_at:at});
    updateRowById_('ORDERS',order.id,{status:'PAID',paid_at:at});
    audit_(a.auth.user.id,'APPROVE_PAYMENT','ORDER',order.id,'Bukti pembayaran disetujui');
    const reg=findOne_('REGISTRATIONS','id',order.registration_id);
    if(reg)emailSafe_(reg.email,'Pembayaran Nalarva dikonfirmasi','Pembayaran untuk invoice '+String(order.invoice_no||order.id)+' telah dikonfirmasi. Admin akan melanjutkan aktivasi akun belajar Anda.',siteUrl_()+'/pembayaran','PAY-APPROVED-'+order.id);
    return json_({ok:true,message:'Bukti pembayaran disetujui. Tagihan berstatus PAID.'});
  }
  if(decision==='REJECT'){
    updateRowById_('PAYMENTS',proof.id,{status:'REJECTED',review_notes:clean_(b.notes,500),confirmed_by:a.auth.user.id,confirmed_at:now_()});
    updateRowById_('ORDERS',order.id,{status:'MENUNGGU_PEMBAYARAN'});
    audit_(a.auth.user.id,'REJECT_PAYMENT','ORDER',order.id,'Bukti pembayaran ditolak');
    const reg=findOne_('REGISTRATIONS','id',order.registration_id);
    if(reg)emailSafe_(reg.email,'Bukti pembayaran perlu diperbaiki','Bukti pembayaran untuk invoice '+String(order.invoice_no||order.id)+' belum dapat kami verifikasi. Silakan cek kembali dan unggah bukti yang sesuai. '+clean_(b.notes,500),siteUrl_()+'/pembayaran','PAY-REJECT-'+proof.id);
    return json_({ok:true,message:'Bukti pembayaran ditolak. Calon siswa dapat mengunggah ulang.'});
  }
  return json_({ok:false,message:'Keputusan review tidak valid.'});
}

function subscriptionRowsForUser_(userId) {
  return getRows_('SUBSCRIPTIONS').filter(x=>String(x.user_id)===String(userId));
}
function activeSubscriptionForUser_(userId) {
  const now=new Date();
  const rows=subscriptionRowsForUser_(userId).sort((a,b)=>String(b.end_at).localeCompare(String(a.end_at)));
  rows.forEach(x=>{
    if(String(x.status)==='ACTIVE' && x.end_at && new Date(x.end_at)<now) updateRowById_('SUBSCRIPTIONS',x.id,{status:'EXPIRED',updated_at:now_()});
  });
  return rows.find(x=>String(x.status)==='ACTIVE' && (!x.end_at||new Date(x.end_at)>=now))||null;
}
function hasLearningAccess_(userId){return Boolean(activeSubscriptionForUser_(userId));}

function studentAccessData_(userId) {
  const sub=activeSubscriptionForUser_(userId);
  if(!sub)return {active:false,status:'INACTIVE',startAt:'',endAt:'',daysLeft:0,packageName:'',programName:'',source:''};
  const pkg=findOne_('PACKAGES','id',sub.package_id)||{},program=findOne_('PROGRAMS','id',sub.program_id)||{};
  const days=Math.max(0,Math.ceil((new Date(sub.end_at).getTime()-Date.now())/(24*60*60*1000)));
  return {active:true,status:String(sub.status),startAt:String(sub.start_at||''),endAt:String(sub.end_at||''),daysLeft:days,packageName:String(pkg.name||sub.source||'Akses Nalarva'),programName:String(program.name||''),source:String(sub.source||'')};
}

function grantOrExtendSubscription_(userId,pkg,order,program,source) {
  const duration=Math.max(1,Number(pkg.duration_days||30));
  const existing=activeSubscriptionForUser_(userId);
  const now=new Date(),base=existing&&existing.end_at&&new Date(existing.end_at)>now?new Date(existing.end_at):now,end=new Date(base.getTime()+duration*24*60*60*1000);
  if(existing && (!program||String(existing.program_id)===String(program.id))){
    updateRowById_('SUBSCRIPTIONS',existing.id,{package_id:pkg.id,order_id:order.id,program_id:program?program.id:existing.program_id,end_at:end.toISOString(),status:'ACTIVE',source:source,updated_at:now_()});
    return findOne_('SUBSCRIPTIONS','id',existing.id);
  }
  const row={id:id_('SUB'),user_id:userId,package_id:pkg.id,order_id:order.id,program_id:program?program.id:'',start_at:now.toISOString(),end_at:end.toISOString(),status:'ACTIVE',source:source,created_at:now_(),updated_at:now_()};
  appendObject_('SUBSCRIPTIONS',row);return row;
}

function grantManualSubscription_(userId,programId,source) {
  if(activeSubscriptionForUser_(userId))return;
  const now=new Date(),end=new Date(now.getTime()+3650*24*60*60*1000);
  appendObject_('SUBSCRIPTIONS',{id:id_('SUB'),user_id:userId,package_id:'',order_id:'',program_id:programId||'',start_at:now.toISOString(),end_at:end.toISOString(),status:'ACTIVE',source:source||'LEGACY',created_at:now_(),updated_at:now_()});
}

function ensureLegacySubscriptions_() {
  getRows_('STUDENTS').filter(x=>String(x.status)==='ACTIVE').forEach(s=>{if(!subscriptionRowsForUser_(s.user_id).length)grantManualSubscription_(s.user_id,s.program_id,'LEGACY_MIGRATION')});
}

function handleStudentAccessStatus_(b) {
  const a=authRequest_(b,['SISWA']);if(!a.ok)return authError_(a);
  return json_({ok:true,data:studentAccessData_(a.auth.user.id)});
}
function handleStudentBilling_(b) {
  const a=authRequest_(b,['SISWA']);if(!a.ok)return authError_(a);
  const packages=indexBy_(getRows_('PACKAGES'),'id');
  const orders=getRows_('ORDERS').filter(x=>String(x.user_id)===String(a.auth.user.id)).map(x=>Object.assign({},x,{package_name:(packages[String(x.package_id)]||{}).name||''})).sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
  return json_({ok:true,data:{access:studentAccessData_(a.auth.user.id),orders:orders}});
}

function handleAdminListPaymentSettings_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  return json_({ok:true,data:paymentPublicSettings_()});
}
function handleAdminSavePaymentSettings_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  upsertSetting_('BANK_NAME',clean_(b.bankName,100),'Nama bank penerima pembayaran');
  upsertSetting_('BANK_ACCOUNT',clean_(b.bankAccount,100),'Nomor rekening penerima');
  upsertSetting_('BANK_HOLDER',clean_(b.bankHolder,120),'Nama pemilik rekening');
  upsertSetting_('PAYMENT_NOTE',clean_(b.paymentNote,800),'Catatan yang tampil pada invoice');
  upsertSetting_('SITE_URL',clean_(b.siteUrl,300)||'https://nalarva.com','Alamat publik website Nalarva');
  upsertSetting_('SENDER_NAME',clean_(b.senderName,100)||'Nalarva','Nama pengirim email');
  upsertSetting_('REPLY_TO',clean_(b.replyTo,180).toLowerCase(),'Alamat email untuk balasan');
  upsertSetting_('ADMIN_NOTIFICATION_EMAIL',clean_(b.adminNotificationEmail,180).toLowerCase(),'Email penerima notifikasi operasional Admin');
  audit_(a.auth.user.id,'UPDATE','SETTINGS','PAYMENT','Memperbarui informasi pembayaran dan email');
  return json_({ok:true,message:'Pengaturan pembayaran disimpan.',data:paymentPublicSettings_()});
}
function handleAdminListSubscriptions_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const users=indexBy_(getRows_('USERS'),'id'),packages=indexBy_(getRows_('PACKAGES'),'id'),programs=indexBy_(getRows_('PROGRAMS'),'id');
  const rows=getRows_('SUBSCRIPTIONS').map(x=>{
    const u=users[String(x.user_id)]||{},p=packages[String(x.package_id)]||{},pr=programs[String(x.program_id)]||{};
    let effectiveStatus=String(x.status);
    if(effectiveStatus==='ACTIVE'&&x.end_at&&new Date(x.end_at)<new Date()){effectiveStatus='EXPIRED';updateRowById_('SUBSCRIPTIONS',x.id,{status:'EXPIRED',updated_at:now_()});}
    return Object.assign({},x,{status:effectiveStatus,student_name:u.name||'',student_email:u.email||'',package_name:p.name||'',program_name:pr.name||''});
  }).sort((x,y)=>String(y.end_at).localeCompare(String(x.end_at)));
  return json_({ok:true,data:rows});
}
function handleAdminUpdateSubscription_(b) {
  const a=authRequest_(b,['ADMIN']);if(!a.ok)return authError_(a);
  const sub=findOne_('SUBSCRIPTIONS','id',b.subscriptionId);if(!sub)return json_({ok:false,message:'Langganan tidak ditemukan.'});
  const op=clean_(b.operation,30).toUpperCase();
  if(op==='EXTEND_30'){
    const base=sub.end_at&&new Date(sub.end_at)>new Date()?new Date(sub.end_at):new Date(),end=new Date(base.getTime()+30*24*60*60*1000);
    updateRowById_('SUBSCRIPTIONS',sub.id,{end_at:end.toISOString(),status:'ACTIVE',updated_at:now_()});
  }else if(op==='SUSPEND')updateRowById_('SUBSCRIPTIONS',sub.id,{status:'SUSPENDED',updated_at:now_()});
  else if(op==='ACTIVATE')updateRowById_('SUBSCRIPTIONS',sub.id,{status:'ACTIVE',updated_at:now_()});
  else return json_({ok:false,message:'Operasi langganan tidak dikenal.'});
  audit_(a.auth.user.id,'UPDATE','SUBSCRIPTION',sub.id,op);
  return json_({ok:true,message:'Langganan berhasil diperbarui.'});
}

/* =========================================================
 * COMMERCIAL WORKFLOW v4
 * Registration -> Order -> Payment -> Student activation
 * ========================================================= */

function handlePublicPackages_() {
  const programs=indexBy_(getRows_('PROGRAMS'),'id');
  const rows=getRows_('PACKAGES').filter(x=>String(x.status)==='ACTIVE').map(x=>Object.assign({},x,{program_name:(programs[String(x.program_id)]||{}).name||'Semua jenjang'}));
  rows.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
  return json_({ok:true,data:rows});
}

function handleListPackages_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const programs=indexBy_(getRows_('PROGRAMS'),'id');
  const rows=getRows_('PACKAGES').map(x=>Object.assign({},x,{program_name:(programs[String(x.program_id)]||{}).name||'Semua jenjang'}));
  return json_({ok:true,data:rows});
}

function handleAdminUpsertPackage_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const code=clean_(b.code,40).toUpperCase().replace(/[^A-Z0-9_-]/g,'');
  const name=clean_(b.name,120);
  const status=clean_(b.status,20).toUpperCase()||'DRAFT';
  const price=Math.max(0,Number(b.price||0));
  if(!code||!name) return json_({ok:false,message:'Kode dan nama paket wajib diisi.'});
  if(['DRAFT','ACTIVE','ARCHIVED'].indexOf(status)<0) return json_({ok:false,message:'Status paket tidak valid.'});
  const programId=clean_(b.programId,80);
  if(programId && !findOne_('PROGRAMS','id',programId)) return json_({ok:false,message:'Program tidak ditemukan.'});
  const existing=findOne_('PACKAGES','code',code);
  const patch={
    code:code,name:name,program_id:programId,billing_period:clean_(b.billingPeriod,30)||'BULANAN',
    price:price,class_sessions:Math.max(0,Number(b.classSessions||0)),tryout_quota:Math.max(0,Number(b.tryoutQuota||0)),duration_days:Math.max(1,Number(b.durationDays||30)),
    description:clean_(b.description,1200),status:status,updated_at:now_()
  };
  if(existing){
    updateRowById_('PACKAGES',existing.id,patch);
    audit_(a.auth.user.id,'UPDATE','PACKAGE',existing.id,'Memperbarui paket '+code);
    return json_({ok:true,message:'Paket berhasil diperbarui.',data:Object.assign({},existing,patch)});
  }
  const row=Object.assign({id:id_('PKG'),created_at:now_()},patch);
  appendObject_('PACKAGES',row);
  audit_(a.auth.user.id,'CREATE','PACKAGE',row.id,'Membuat paket '+code);
  return json_({ok:true,message:'Paket berhasil dibuat.',data:row});
}

function handleAdminListOrders_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const regs=indexBy_(getRows_('REGISTRATIONS'),'id'),packages=indexBy_(getRows_('PACKAGES'),'id');
  const payments=getRows_('PAYMENTS');
  const rows=getRows_('ORDERS').map(x=>{
    const r=regs[String(x.registration_id)]||{},p=packages[String(x.package_id)]||{};
    const proof=payments.filter(pay=>String(pay.order_id)===String(x.id)).sort((a,b)=>String(b.submitted_at).localeCompare(String(a.submitted_at)))[0]||{};
    return Object.assign({},x,{registration_name:r.name||'',registration_email:r.email||'',registration_phone:r.phone||'',registration_level:r.level||'',package_name:p.name||'',package_code:p.code||'',proof_status:proof.status||'',proof_url:proof.proof_url||'',proof_id:proof.id||''});
  }).sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
  return json_({ok:true,data:rows});
}

function handleAdminCreateOrder_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const reg=findOne_('REGISTRATIONS','id',b.registrationId);
  const pkg=findOne_('PACKAGES','id',b.packageId);
  if(!reg) return json_({ok:false,message:'Pendaftaran tidak ditemukan.'});
  if(!pkg || String(pkg.status)!=='ACTIVE') return json_({ok:false,message:'Pilih paket yang aktif.'});
  if(['AKTIF','BATAL'].indexOf(String(reg.status))>=0) return json_({ok:false,message:'Pendaftaran ini sudah selesai atau dibatalkan.'});
  const existing=getRows_('ORDERS').find(x=>String(x.registration_id)===String(reg.id)&&['MENUNGGU_PEMBAYARAN','PAID'].indexOf(String(x.status))>=0);
  if(existing) return json_({ok:false,message:'Pendaftaran ini masih memiliki tagihan aktif.'});
  const due=b.dueDate?new Date(String(b.dueDate)+'T23:59:59').toISOString():new Date(Date.now()+3*24*60*60*1000).toISOString();
  const row={
    id:id_('ORD'),invoice_no:nextInvoiceNo_(),registration_id:reg.id,user_id:'',package_id:pkg.id,amount:Number(pkg.price||0),
    payment_method:clean_(b.paymentMethod,40)||'TRANSFER',status:Number(pkg.price||0)===0?'PAID':'MENUNGGU_PEMBAYARAN',
    notes:clean_(b.notes,800),due_at:due,created_at:now_(),paid_at:Number(pkg.price||0)===0?now_():'',activated_at:''
  };
  appendObject_('ORDERS',row);
  updateRowById_('REGISTRATIONS',reg.id,{status:Number(pkg.price||0)===0?'DIHUBUNGI':'MENUNGGU_PEMBAYARAN'});
  audit_(a.auth.user.id,'CREATE','ORDER',row.id,'Tagihan '+reg.email+' '+pkg.code);
  const payLink=siteUrl_()+'/pembayaran';
  emailSafe_(reg.email,'Invoice Nalarva '+row.invoice_no,'Invoice '+row.invoice_no+' untuk paket '+pkg.name+' telah dibuat. Total pembayaran: Rp'+Number(row.amount||0).toLocaleString('id-ID')+'. Gunakan nomor invoice dan email pendaftaran untuk membuka detail pembayaran.',payLink,'ORDER-'+row.id);
  notifyAdmins_('PEMBAYARAN','Invoice dibuat','Invoice '+row.invoice_no+' dibuat untuk '+reg.name+'.','/dashboard/admin/pendaftaran','ADMIN-ORDER-'+row.id);
  return json_({ok:true,message:Number(pkg.price||0)===0?'Tagihan Rp0 dibuat dan siap diaktifkan.':'Tagihan berhasil dibuat.',data:row});
}

function handleAdminMarkOrderPaid_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const order=findOne_('ORDERS','id',b.orderId);
  if(!order) return json_({ok:false,message:'Tagihan tidak ditemukan.'});
  if(String(order.status)==='ACTIVATED') return json_({ok:false,message:'Tagihan ini sudah diaktifkan.'});
  if(String(order.status)==='PAID') return json_({ok:true,message:'Pembayaran sudah dikonfirmasi sebelumnya.',data:order});
  if(String(order.status)!=='MENUNGGU_PEMBAYARAN') return json_({ok:false,message:'Status tagihan tidak dapat dikonfirmasi.'});
  const paidAt=now_();
  updateRowById_('ORDERS',order.id,{status:'PAID',paid_at:paidAt});
  appendObject_('PAYMENTS',{id:id_('PAY'),order_id:order.id,amount:Number(order.amount||0),method:order.payment_method,reference:clean_(b.reference,160),proof_file_id:'',proof_url:'',submitted_by:'ADMIN',submitted_at:paidAt,review_notes:'Konfirmasi manual admin',status:'CONFIRMED',confirmed_by:a.auth.user.id,confirmed_at:paidAt});
  const reg=findOne_('REGISTRATIONS','id',order.registration_id);if(reg) updateRowById_('REGISTRATIONS',reg.id,{status:'DIHUBUNGI'});
  audit_(a.auth.user.id,'CONFIRM_PAYMENT','ORDER',order.id,'Pembayaran dikonfirmasi');
  if(reg)emailSafe_(reg.email,'Pembayaran Nalarva dikonfirmasi','Pembayaran untuk invoice '+String(order.invoice_no||order.id)+' sudah dikonfirmasi. Admin akan melanjutkan aktivasi akun belajar Anda.',siteUrl_()+'/pembayaran','PAY-MANUAL-'+order.id);
  return json_({ok:true,message:'Pembayaran berhasil dikonfirmasi.'});
}

function resolveProgramForCommercial_(reg,pkg) {
  if(pkg && pkg.program_id){
    const direct=findOne_('PROGRAMS','id',pkg.program_id);if(direct)return direct;
  }
  const level=clean_(reg.level,40).replace(/^TKA\s*/i,'').toUpperCase();
  return getRows_('PROGRAMS').find(x=>String(x.level).toUpperCase()===level)||null;
}

function ensureStudentFromRegistration_(reg,program) {
  let user=findOne_('USERS','email',String(reg.email).toLowerCase());
  let temporaryPassword='';
  if(user && String(user.role)!=='SISWA') throw new Error('Email pendaftar sudah digunakan oleh akun non-siswa.');
  if(!user){
    temporaryPassword=tempPassword_();
    user=createUser(reg.email,temporaryPassword,'SISWA',reg.name);
  }
  let student=findOne_('STUDENTS','user_id',user.id);
  if(!student){
    student={id:id_('STU'),user_id:user.id,student_no:nextNo_('NV-S-','STUDENTS'),level:clean_(reg.level,20).replace(/^TKA\s*/i,''),grade:'',school:clean_(reg.school,160),student_phone:clean_(reg.phone,40),birth_date:'',city:'',address:'',parent_name:'',parent_phone:clean_(reg.phone,40),parent_email:'',guardian_relation:'ORANG_TUA',program_id:program?program.id:'',status:'ACTIVE',joined_at:now_()};
    appendObject_('STUDENTS',student);
  }else{
    updateRowById_('STUDENTS',student.id,{program_id:program?program.id:student.program_id,status:'ACTIVE'});
  }
  return {user:user,student:student,temporaryPassword:temporaryPassword};
}

function handleAdminActivateOrder_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const order=findOne_('ORDERS','id',b.orderId);if(!order)return json_({ok:false,message:'Tagihan tidak ditemukan.'});
  if(String(order.status)==='ACTIVATED') return json_({ok:false,message:'Akun dari tagihan ini sudah diaktifkan.'});
  if(String(order.status)!=='PAID') return json_({ok:false,message:'Pembayaran harus dikonfirmasi sebelum aktivasi akun.'});
  const reg=findOne_('REGISTRATIONS','id',order.registration_id),pkg=findOne_('PACKAGES','id',order.package_id);
  if(!reg||!pkg) return json_({ok:false,message:'Data pendaftaran atau paket tidak lengkap.'});
  const program=resolveProgramForCommercial_(reg,pkg);
  const created=ensureStudentFromRegistration_(reg,program);
  const classId=clean_(b.classId,80);
  if(classId){
    const cls=findOne_('CLASSES','id',classId);if(!cls)return json_({ok:false,message:'Kelas tujuan tidak ditemukan.'});
    if(program && String(cls.program_id)!==String(program.id)) return json_({ok:false,message:'Kelas tidak sesuai dengan program siswa.'});
    const used=getRows_('ENROLLMENTS').filter(x=>String(x.class_id)===String(cls.id)&&String(x.status)==='ACTIVE').length;
    if(Number(cls.capacity||0)>0 && used>=Number(cls.capacity||0)) return json_({ok:false,message:'Kapasitas kelas sudah penuh.'});
    const enr=getRows_('ENROLLMENTS').find(x=>String(x.class_id)===String(cls.id)&&String(x.student_user_id)===String(created.user.id));
    if(enr) updateRowById_('ENROLLMENTS',enr.id,{status:'ACTIVE'});
    else appendObject_('ENROLLMENTS',{id:id_('ENR'),class_id:cls.id,student_user_id:created.user.id,status:'ACTIVE',enrolled_at:now_()});
  }
  const at=now_();
  updateRowById_('ORDERS',order.id,{user_id:created.user.id,status:'ACTIVATED',activated_at:at});
  updateRowById_('REGISTRATIONS',reg.id,{status:'AKTIF'});
  const subscription=grantOrExtendSubscription_(created.user.id,pkg,order,program,'COMMERCIAL');
  audit_(a.auth.user.id,'ACTIVATE','ORDER',order.id,'Mengaktifkan siswa '+reg.email);
  const credential=created.temporaryPassword?('\nEmail login: '+created.user.email+'\nPassword sementara: '+created.temporaryPassword):('\nGunakan akun Nalarva yang sudah Anda miliki.');
  const activationMessage='Akun belajar Anda sudah aktif untuk '+String(pkg.name||'paket Nalarva')+'. Masa aktif sampai '+Utilities.formatDate(new Date(subscription.end_at),Session.getScriptTimeZone()||'Asia/Jakarta','dd MMMM yyyy')+'.'+credential;
  notifyUser_(created.user.id,'AKUN','Akses belajar Nalarva aktif',activationMessage,'/dashboard/siswa','ACTIVATE-'+order.id,false);
  emailSafe_(created.user.email,'Akses belajar Nalarva aktif',activationMessage,siteUrl_()+'/login','ACTIVATE-'+order.id);
  return json_({ok:true,message:'Akun siswa dan masa aktif paket berhasil diaktifkan.',data:{userId:created.user.id,email:created.user.email,temporaryPassword:created.temporaryPassword||'',program:program?program.name:'',subscriptionEnd:subscription.end_at}});
}

function handleAdminUpdateRegistrationStatus_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const reg=findOne_('REGISTRATIONS','id',b.registrationId);if(!reg)return json_({ok:false,message:'Pendaftaran tidak ditemukan.'});
  const status=clean_(b.status,30).toUpperCase();
  if(['BARU','DIHUBUNGI','MENUNGGU_PEMBAYARAN','AKTIF','BATAL'].indexOf(status)<0)return json_({ok:false,message:'Status pendaftaran tidak valid.'});
  updateRowById_('REGISTRATIONS',reg.id,{status:status});
  audit_(a.auth.user.id,'UPDATE_STATUS','REGISTRATION',reg.id,status);
  return json_({ok:true,message:'Status pendaftaran diperbarui.'});
}

function seedPackages_() {
  if(getRows_('PACKAGES').length) return;
  [
    {id:'PKG-BASIC',code:'BASIC',name:'TKA Basic',program_id:'',billing_period:'BULANAN',price:0,class_sessions:0,tryout_quota:1,duration_days:30,description:'Template awal. Atur harga dan benefit sebelum dipublikasikan.',status:'DRAFT',created_at:now_(),updated_at:now_()},
    {id:'PKG-FOCUS',code:'FOCUS',name:'TKA Focus',program_id:'',billing_period:'BULANAN',price:0,class_sessions:8,tryout_quota:2,duration_days:30,description:'Template rekomendasi. Atur harga dan benefit sebelum dipublikasikan.',status:'DRAFT',created_at:now_(),updated_at:now_()},
    {id:'PKG-INTENSIVE',code:'INTENSIVE',name:'TKA Intensive',program_id:'',billing_period:'BULANAN',price:0,class_sessions:12,tryout_quota:4,duration_days:30,description:'Template intensif. Atur harga dan benefit sebelum dipublikasikan.',status:'DRAFT',created_at:now_(),updated_at:now_()}
  ].forEach(x=>appendObject_('PACKAGES',x));
}

function handleListRegistrations_(b) {
  const a=authRequest_(b,['ADMIN']); if(!a.ok) return authError_(a);
  const rows=getRows_('REGISTRATIONS'); rows.sort((x,y)=>String(y.created_at).localeCompare(String(x.created_at)));
  return json_({ok:true,data:rows});
}

function indexBy_(rows,key){const out={};rows.forEach(x=>out[String(x[key])]=x);return out;}
function unique_(arr){const out=[];arr.forEach(x=>{if(x && out.indexOf(String(x))<0)out.push(String(x));});return out;}


function createUser(email,password,role,name) {
  email = clean_(email,180).toLowerCase(); role = String(role || 'SISWA').toUpperCase(); name = clean_(name,120);
  if (!email || !password || !name) throw new Error('email, password, dan name wajib diisi');
  if (['SISWA','TUTOR','ADMIN','ORANG_TUA'].indexOf(role) < 0) throw new Error('Role tidak valid');
  if (findOne_('USERS','email',email)) throw new Error('Email sudah terdaftar');
  const salt = Utilities.getUuid();
  const user = {id:id_('USR'),email,password_hash:hashPassword_(String(password),salt),salt,role,name,status:'ACTIVE',created_at:now_(),updated_at:now_()};
  appendObject_('USERS',user);
  return publicUser_(user);
}

function resetUserPassword(email,newPassword) {
  const user = findOne_('USERS','email',String(email).toLowerCase());
  if (!user) throw new Error('User tidak ditemukan');
  const salt = Utilities.getUuid();
  updateRowById_('USERS',user.id,{salt,password_hash:hashPassword_(String(newPassword),salt),updated_at:now_()});
  return {ok:true,email:user.email};
}

function ensureInitialAdmin_() {
  const email = 'admin@nalarva.com';
  const existing = findOne_('USERS','email',email);
  if (existing) return {email:email,temporaryPassword:null};
  const temp = 'Nv#' + Utilities.getUuid().replace(/-/g,'').slice(0,10) + '!';
  createUser(email,temp,'ADMIN','Admin Nalarva');
  return {email:email,temporaryPassword:temp};
}

function seedPrograms_() {
  if (getRows_('PROGRAMS').length) return;
  [
    {id:'PRG-SD',code:'TKA-SD',name:'TKA SD',level:'SD',description:'Fondasi literasi dan numerasi.',status:'ACTIVE',created_at:now_()},
    {id:'PRG-SMP',code:'TKA-SMP',name:'TKA SMP',level:'SMP',description:'Penguatan konsep dan strategi soal.',status:'ACTIVE',created_at:now_()},
    {id:'PRG-SMA',code:'TKA-SMA',name:'TKA SMA',level:'SMA',description:'Persiapan TKA intensif dan terukur.',status:'ACTIVE',created_at:now_()}
  ].forEach(x => appendObject_('PROGRAMS',x));
}


function createDemoAccounts() {
  const accounts=[];
  [
    ['siswa@nalarva.com','SISWA','Siswa Demo'],
    ['tutor@nalarva.com','TUTOR','Tutor Demo']
  ].forEach(item=>{
    if(findOne_('USERS','email',item[0])) { accounts.push({email:item[0],status:'sudah ada'}); return; }
    const password='Nv#'+Utilities.getUuid().replace(/-/g,'').slice(0,10)+'!';
    createUser(item[0],password,item[1],item[2]);
    accounts.push({email:item[0],role:item[1],temporaryPassword:password});
  });
  console.log(JSON.stringify(accounts,null,2));
  return accounts;
}


/**
 * OPSIONAL UNTUK PENGUJIAN.
 * Membuat akun siswa+tutor demo, satu kelas, jadwal, dan tryout 3 soal.
 * Jangan jalankan bila database produksi tidak ingin berisi data demo.
 */
function setupDemoLearningData() {
  const result={};

  let tutor=findOne_('USERS','email','tutor@nalarva.com');
  if(!tutor){
    const pw='Tutor#Nalarva26!';
    tutor=createUser('tutor@nalarva.com',pw,'TUTOR','Raka Pratama');
    result.tutorPassword=pw;
  }
  if(!findOne_('TUTORS','user_id',tutor.id)) appendObject_('TUTORS',{id:id_('TUT'),user_id:tutor.id,tutor_no:'NV-T-DEMO',specialization:'Matematika & Numerasi',phone:'0800000000',status:'ACTIVE',joined_at:now_()});

  let siswa=findOne_('USERS','email','siswa@nalarva.com');
  if(!siswa){
    const pw='Siswa#Nalarva26!';
    siswa=createUser('siswa@nalarva.com',pw,'SISWA','Anisa Demo');
    result.studentPassword=pw;
  }
  if(!findOne_('STUDENTS','user_id',siswa.id)) appendObject_('STUDENTS',{id:id_('STU'),user_id:siswa.id,student_no:'NV-S-DEMO',level:'SMA',school:'Sekolah Demo',parent_name:'',parent_phone:'',program_id:'PRG-SMA',status:'ACTIVE',joined_at:now_()});

  let cls=findOne_('CLASSES','code','DEMO-SMA-A');
  if(!cls){
    cls={id:id_('CLS'),program_id:'PRG-SMA',code:'DEMO-SMA-A',name:'TKA SMA Demo',tutor_user_id:tutor.id,capacity:20,status:'ACTIVE',start_date:now_().slice(0,10),end_date:''};
    appendObject_('CLASSES',cls);
  }
  if(!getRows_('ENROLLMENTS').find(x=>String(x.class_id)===String(cls.id)&&String(x.student_user_id)===String(siswa.id))) appendObject_('ENROLLMENTS',{id:id_('ENR'),class_id:cls.id,student_user_id:siswa.id,status:'ACTIVE',enrolled_at:now_()});
  if(!getRows_('SCHEDULES').find(x=>String(x.class_id)===String(cls.id))) {
    const start=new Date(Date.now()+24*60*60*1000),end=new Date(start.getTime()+90*60*1000);
    appendObject_('SCHEDULES',{id:id_('SCH'),class_id:cls.id,title:'Kelas Demo Matematika TKA',start_at:iso_(start),end_at:iso_(end),meeting_url:'https://meet.google.com/',notes:'Jadwal demo',status:'SCHEDULED'});
  }

  const qdefs=[
    ['DEMO-Q1','Matematika','Numerasi','Jika 3x + 5 = 20, nilai x adalah ...','3','4','5','6','7','C','MUDAH'],
    ['DEMO-Q2','Matematika','Persentase','Harga Rp200.000 mendapat diskon 15%. Harga setelah diskon adalah ...','Rp160.000','Rp165.000','Rp170.000','Rp175.000','Rp180.000','C','SEDANG'],
    ['DEMO-Q3','Bahasa Indonesia','Literasi','Tujuan utama sebuah simpulan dalam teks adalah ...','Menambah topik baru','Merangkum gagasan utama','Mengubah fakta','Mengulang seluruh paragraf','Menghapus argumen','B','MUDAH']
  ];
  qdefs.forEach(q=>{if(!findOne_('QUESTIONS','id',q[0])) appendObject_('QUESTIONS',{id:q[0],program_id:'PRG-SMA',subject:q[1],topic:q[2],question_type:'MCQ',question_text:q[3],option_a:q[4],option_b:q[5],option_c:q[6],option_d:q[7],option_e:q[8],correct_answer:q[9],explanation:'Soal demo Nalarva.',difficulty:q[10],status:'ACTIVE'});});

  let exam=findOne_('EXAMS','code','DEMO-TO-SMA');
  if(!exam){
    const start=new Date(Date.now()-24*60*60*1000),end=new Date(Date.now()+365*24*60*60*1000);
    exam={id:id_('EXM'),program_id:'PRG-SMA',code:'DEMO-TO-SMA',title:'Tryout Demo TKA SMA',duration_minutes:30,start_at:iso_(start),end_at:iso_(end),status:'PUBLISHED',created_at:now_()};
    appendObject_('EXAMS',exam);
  }
  qdefs.forEach((q,i)=>{if(!getRows_('EXAM_ITEMS').find(x=>String(x.exam_id)===String(exam.id)&&String(x.question_id)===String(q[0]))) appendObject_('EXAM_ITEMS',{id:id_('EIT'),exam_id:exam.id,question_id:q[0],order_no:i+1,points:1});});

  result.ok=true;
  result.tutorEmail='tutor@nalarva.com';
  result.studentEmail='siswa@nalarva.com';
  result.note='Jika password tidak tampil, akun demo sudah pernah dibuat dan password tidak diubah.';
  console.log(JSON.stringify(result,null,2));
  return result;
}

function db_() {
  const id = PropertiesService.getScriptProperties().getProperty('NALARVA_SPREADSHEET_ID');
  if (!id) throw new Error('Backend belum disiapkan. Jalankan setupNalarva() terlebih dahulu.');
  return SpreadsheetApp.openById(id);
}

function ensureSheet_(ss,name,headers) {
  let sh=ss.getSheetByName(name);
  if(!sh) sh=ss.insertSheet(name);
  if(sh.getLastRow()===0) {
    sh.getRange(1,1,1,headers.length).setValues([headers]);
  } else {
    const existing=sh.getRange(1,1,1,Math.max(1,sh.getLastColumn())).getValues()[0].map(String);
    const missing=headers.filter(h=>existing.indexOf(String(h))<0);
    if(missing.length) sh.getRange(1,existing.length+1,1,missing.length).setValues([missing]);
  }
  sh.setFrozenRows(1);
  sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#10284C').setFontColor('#FFFFFF');
  sh.autoResizeColumns(1,headers.length);
}

function ensureChildFolder_(root,name) {
  const it=root.getFoldersByName(name);
  return it.hasNext()?it.next():root.createFolder(name);
}

function appendObject_(sheetName,obj) {
  const sh=db_().getSheetByName(sheetName); if(!sh) throw new Error('Sheet '+sheetName+' tidak ditemukan');
  const headers=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),SCHEMA[sheetName].length)).getValues()[0].map(String);
  sh.appendRow(headers.map(h => safeCell_(obj[h] == null ? '' : obj[h])));
}

function getRows_(sheetName) {
  const sh=db_().getSheetByName(sheetName); if(!sh || sh.getLastRow()<2) return [];
  const width=Math.max(sh.getLastColumn(),SCHEMA[sheetName].length);
  const values=sh.getRange(1,1,sh.getLastRow(),width).getValues();
  const headers=values[0].map(String);
  return values.slice(1).map(r => {const o={};headers.forEach((h,i)=>{if(h)o[h]=r[i]});return o;});
}

function findOne_(sheetName,key,value) {
  return getRows_(sheetName).find(r => String(r[key]).toLowerCase()===String(value).toLowerCase()) || null;
}

function updateRowById_(sheetName,id,patch) {
  const sh=db_().getSheetByName(sheetName);
  const headers=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),SCHEMA[sheetName].length)).getValues()[0].map(String);
  if(sh.getLastRow()<2) return false;
  const idKey=headers.indexOf('id')>=0?'id':headers[0],idCol=headers.indexOf(idKey);
  const ids=sh.getRange(2,idCol+1,sh.getLastRow()-1,1).getValues().flat().map(String);
  const index=ids.indexOf(String(id)); if(index<0) return false;
  const row=index+2;
  Object.keys(patch).forEach(k=>{const col=headers.indexOf(k);if(col>=0) sh.getRange(row,col+1).setValue(safeCell_(patch[k]));});
  return true;
}

function sessionUser_(token) {
  if(!token) return null;
  const hash=hashToken_(token), now=new Date();
  const session=getRows_('SESSIONS').find(s => String(s.token_hash)===hash && String(s.status)==='ACTIVE');
  if(!session || new Date(session.expires_at)<=now) return null;
  const user=findOne_('USERS','id',session.user_id);
  if(!user || String(user.status)!=='ACTIVE') return null;
  return {session,user};
}

function hashPassword_(password,salt) {
  const pepper=PropertiesService.getScriptProperties().getProperty('NALARVA_AUTH_PEPPER') || '';
  return bytesToHex_(Utilities.computeHmacSha256Signature(String(password)+'|'+String(salt),pepper));
}
function hashToken_(token) {
  const pepper=PropertiesService.getScriptProperties().getProperty('NALARVA_AUTH_PEPPER') || '';
  return bytesToHex_(Utilities.computeHmacSha256Signature(String(token),pepper));
}
function bytesToHex_(bytes){return bytes.map(b=>(b<0?b+256:b).toString(16).padStart(2,'0')).join('');}
function safeEqual_(a,b){if(a.length!==b.length)return false;let x=0;for(let i=0;i<a.length;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;}
function publicUser_(u){return {id:String(u.id),email:String(u.email),name:String(u.name),role:String(u.role)};}
function audit_(userId,action,entity,entityId,detail){appendObject_('AUDIT_LOG',{id:id_('LOG'),user_id:userId,action,entity,entity_id:entityId,detail,created_at:now_()});}
function id_(prefix){return prefix+'-'+Utilities.getUuid().replace(/-/g,'').slice(0,16).toUpperCase();}
function now_(){return new Date().toISOString();} function iso_(d){return d.toISOString();}
function clean_(v,max){return String(v==null?'':v).trim().slice(0,max||500);}
function safeCell_(v){if(typeof v==='string' && /^[=+\-@]/.test(v)) return "'"+v;return v;}
function json_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}
