import type {ApiResult} from "@/lib/apps-script";

const demoClasses = [
  {id:"CLS-SMA-A",program_id:"PRG-SMA",program_name:"TKA SMA",code:"SMA-A",name:"TKA SMA Intensif A",tutor_user_id:"USR-TUTOR",tutor_name:"Raka Pratama",capacity:24,status:"ACTIVE",start_date:"2026-08-01",end_date:"2026-11-30"},
  {id:"CLS-SMP-A",program_id:"PRG-SMP",program_name:"TKA SMP",code:"SMP-A",name:"TKA SMP Reguler A",tutor_user_id:"USR-TUTOR",tutor_name:"Raka Pratama",capacity:20,status:"ACTIVE",start_date:"2026-08-01",end_date:"2026-11-30"},
];
const schedules = [
  {id:"SCH-1",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",title:"Matematika — Strategi Numerasi",start_at:"2026-08-19T19:00:00+07:00",end_at:"2026-08-19T20:30:00+07:00",meeting_url:"https://zoom.us/",notes:"Siapkan latihan #04",status:"SCHEDULED"},
  {id:"SCH-2",class_id:"CLS-SMP-A",class_name:"TKA SMP Reguler A",title:"Literasi Bahasa Indonesia",start_at:"2026-08-21T16:00:00+07:00",end_at:"2026-08-21T17:30:00+07:00",meeting_url:"https://zoom.us/",notes:"",status:"SCHEDULED"},
];
const materials = [
  {id:"MAT-1",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",title:"Strategi Numerasi Dasar",type:"PDF",drive_url:"#",description:"Ringkasan konsep dan strategi pengerjaan.",published_at:"2026-08-18T10:00:00+07:00",status:"PUBLISHED"},
  {id:"MAT-2",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",title:"Memahami Informasi Teks",type:"PDF",drive_url:"#",description:"Latihan membaca kritis.",published_at:"2026-08-17T10:00:00+07:00",status:"PUBLISHED"},
];
const assignments = [
  {id:"ASG-1",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",title:"Latihan Numerasi #04",description:"Kerjakan 20 soal dan unggah jawaban.",due_at:"2026-08-22T21:00:00+07:00",status:"PUBLISHED",submission_status:"BELUM",score:""},
  {id:"ASG-2",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",title:"Analisis Teks #02",description:"Tugas pemahaman bacaan.",due_at:"2026-08-24T21:00:00+07:00",status:"PUBLISHED",submission_status:"DINILAI",score:88},
];
const exams = [
  {id:"EXM-1",program_id:"PRG-SMA",program_name:"TKA SMA",code:"TO-SMA-01",title:"Tryout TKA SMA #01",duration_minutes:60,start_at:"2026-08-01T00:00:00+07:00",end_at:"2026-09-01T23:59:59+07:00",status:"PUBLISHED",question_count:3},
];
const questions = [
  {id:"Q1",program_id:"PRG-SMA",subject:"Matematika",topic:"Numerasi",question_type:"MCQ",question_text:"Jika 3x + 5 = 20, nilai x adalah ...",option_a:"3",option_b:"4",option_c:"5",option_d:"6",option_e:"7",difficulty:"MUDAH",status:"ACTIVE"},
  {id:"Q2",program_id:"PRG-SMA",subject:"Matematika",topic:"Persentase",question_type:"MCQ",question_text:"Harga Rp200.000 mendapat diskon 15%. Harga setelah diskon adalah ...",option_a:"Rp160.000",option_b:"Rp165.000",option_c:"Rp170.000",option_d:"Rp175.000",option_e:"Rp180.000",difficulty:"SEDANG",status:"ACTIVE"},
  {id:"Q3",program_id:"PRG-SMA",subject:"Bahasa Indonesia",topic:"Literasi",question_type:"MCQ",question_text:"Tujuan utama sebuah simpulan dalam teks adalah ...",option_a:"Menambah topik baru",option_b:"Merangkum gagasan utama",option_c:"Mengubah fakta",option_d:"Mengulang seluruh paragraf",option_e:"Menghapus argumen",difficulty:"MUDAH",status:"ACTIVE"},
];
const usersStudents = [
  {id:"USR-S1",name:"Nadia Putri",email:"nadia@example.com",student_no:"NV-S-0001",level:"SMA",school:"SMAN 1",program_id:"PRG-SMA",status:"ACTIVE",joined_at:"2026-08-10"},
  {id:"USR-S2",name:"Rafi Pratama",email:"rafi@example.com",student_no:"NV-S-0002",level:"SMA",school:"SMAN 5",program_id:"PRG-SMA",status:"ACTIVE",joined_at:"2026-08-12"},
  {id:"USR-S3",name:"Kayla Azzahra",email:"kayla@example.com",student_no:"NV-S-0003",level:"SMP",school:"SMPN 3",program_id:"PRG-SMP",status:"ACTIVE",joined_at:"2026-08-15"},
];
const usersTutors = [
  {id:"USR-TUTOR",name:"Raka Pratama",email:"tutor@nalarva.com",tutor_no:"NV-T-0001",specialization:"Matematika & Numerasi",phone:"081200000001",status:"ACTIVE",joined_at:"2026-08-01"},
];
const results = [
  {id:"RES-1",exam_id:"EXM-1",exam_title:"Tryout TKA SMA #01",student_user_id:"demo-user",student_name:"Siswa Demo",score:84,rank:12,percentile:91,analysis_json:JSON.stringify({Numerasi:{correct:8,total:10,accuracy:80},Literasi:{correct:9,total:10,accuracy:90}}),published_at:"2026-08-18T20:00:00+07:00"},
];
const ranking = [
  {rank:1,name:"Alya Ramadhani",score:96},
  {rank:2,name:"Rafi Akbar",score:94},
  {rank:3,name:"Nadia Putri",score:92},
  {rank:12,name:"Siswa Demo",score:84,is_me:true},
];
const registrations = [
  {id:"REG-1",name:"Putri Amelia",email:"putri@example.com",phone:"081234567890",level:"TKA SMA",school:"SMAN 2",status:"BARU",created_at:"2026-08-19T08:00:00+07:00"},
  {id:"REG-2",name:"Fahri Ramadhan",email:"fahri@example.com",phone:"081234567891",level:"TKA SMP",school:"SMPN 4",status:"DIHUBUNGI",created_at:"2026-08-18T10:00:00+07:00"},
];

const packages = [
  {id:"PKG-FOCUS",code:"FOCUS",name:"TKA Focus",program_id:"",program_name:"Semua jenjang",billing_period:"BULANAN",price:0,class_sessions:8,tryout_quota:2,duration_days:30,description:"Template paket. Atur harga dari dashboard Admin.",status:"DRAFT"},
];
const orders = [
  {id:"ORD-DEMO-1",invoice_no:"NV-INV-2026-0001",registration_id:"REG-2",registration_name:"Fahri Ramadhan",registration_email:"fahri@example.com",package_id:"PKG-FOCUS",package_name:"TKA Focus",amount:0,payment_method:"TRANSFER",status:"MENUNGGU_PEMBAYARAN",proof_status:"",proof_url:"",created_at:"2026-08-19T13:00:00+07:00",due_at:"2026-08-23T23:59:59+07:00"},
];

export function demoApi<T=unknown>(action:string, payload:Record<string,unknown>={}):ApiResult<T>{
  let data: unknown = undefined;
  let message = "Mode demo lokal: perubahan disimpan hanya di browser.";
  switch(action){
    case "listPrograms": data=[
      {id:"PRG-SD",code:"TKA-SD",name:"TKA SD",level:"SD",status:"ACTIVE"},
      {id:"PRG-SMP",code:"TKA-SMP",name:"TKA SMP",level:"SMP",status:"ACTIVE"},
      {id:"PRG-SMA",code:"TKA-SMA",name:"TKA SMA",level:"SMA",status:"ACTIVE"},
    ]; break;
    case "listClasses": data=demoClasses.map((x,i)=>({...x,enrolled_count:i===0?2:1})); break;
    case "listSchedules": data=schedules; break;
    case "listMaterials": data=materials; break;
    case "listAssignments": data=assignments; break;
    case "listExams": data=exams; break;
    case "listQuestions": data=questions; break;
    case "adminListStudents": data=usersStudents; break;
    case "adminListTutors": data=usersTutors; break;
    case "listResults": data=results; break;
    case "getRanking": data=ranking; break;
    case "listRegistrations": data=registrations; break;
    case "publicPackages": data=packages.filter(x=>x.status==="ACTIVE"); break;
    case "listPackages": data=packages; break;
    case "adminListOrders": data=orders; break;
    case "adminUpsertPackage": data={id:"PKG-DEMO"}; message="Mode demo: paket tersimpan sementara."; break;
    case "adminCreateOrder": data={id:"ORD-DEMO"}; message="Mode demo: tagihan dibuat."; break;
    case "adminMarkOrderPaid": data={}; message="Mode demo: pembayaran dikonfirmasi."; break;
    case "adminActivateOrder": data={temporaryPassword:"Nv#DEMO2026!"}; message="Mode demo: akun siswa diaktifkan."; break;
    case "adminUpdateRegistrationStatus": data={}; message="Mode demo: status pendaftaran diperbarui."; break;
    case "lookupInvoice": data={invoiceNo:"NV-INV-2026-0001",status:"MENUNGGU_PEMBAYARAN",amount:0,packageName:"TKA Focus",packageCode:"FOCUS",registrationName:"Fahri Ramadhan",registrationEmail:"fahri@example.com",level:"TKA SMP",createdAt:"2026-08-19T13:00:00+07:00",dueAt:"2026-08-23T23:59:59+07:00",paymentMethod:"TRANSFER",payment:paymentSettings,proofStatus:"",proofUrl:""}; break;
    case "submitPaymentProof": data={}; message="Mode demo: bukti pembayaran terkirim."; break;
    case "studentAccessStatus": data={active:true,status:"ACTIVE",startAt:"2026-08-01T00:00:00+07:00",endAt:"2026-09-30T23:59:59+07:00",daysLeft:41,packageName:"TKA Focus",programName:"TKA SMA",source:"DEMO"}; break;
    case "studentBilling": data={access:{active:true,status:"ACTIVE",startAt:"2026-08-01T00:00:00+07:00",endAt:"2026-09-30T23:59:59+07:00",daysLeft:41,packageName:"TKA Focus",programName:"TKA SMA",source:"DEMO"},orders:orders}; break;
    case "adminListPaymentSettings": data=paymentSettings; break;
    case "adminSavePaymentSettings": data=paymentSettings; message="Mode demo: pengaturan pembayaran disimpan."; break;
    case "adminListSubscriptions": data=subscriptions; break;
    case "adminUpdateSubscription": data={}; message="Mode demo: langganan diperbarui."; break;
    case "adminReviewPaymentProof": data={}; message="Mode demo: bukti pembayaran direview."; break;
    case "listNotifications": data=demoNotifications; break;
    case "notificationCount": data={unread:demoNotifications.filter(x=>!x.read_at).length}; break;
    case "markNotificationRead": data={}; message="Notifikasi ditandai dibaca."; break;
    case "markAllNotificationsRead": data={}; message="Semua notifikasi ditandai dibaca."; break;
    case "listCalendarEvents": data=calendarEvents; break;
    case "adminCreateCalendarEvent": data={id:"CAL-DEMO"}; message="Mode demo: agenda kalender dibuat."; break;
    case "listMessages": data=demoMessages; break;
    case "messageRecipients": data=demoRecipients; break;
    case "sendMessage": data={id:"MSG-DEMO"}; message="Mode demo: pesan terkirim."; break;
    case "markMessageRead": data={}; break;
    case "studentProfile": data=demoProfile; break;
    case "updateStudentProfile": data=demoProfile; message="Mode demo: profil diperbarui."; break;
    case "studentCertificates": data=demoCertificates; break;
    case "adminListGuardians": data=demoGuardians; break;
    case "adminCreateGuardian": data={temporaryPassword:"Nv#ParentDemo1!"}; message="Mode demo: akun orang tua dibuat."; break;
    case "parentChildren": data=demoParentChildren; break;
    case "parentOverview": data=demoParentOverview; break;
    case "parentAttendance": data=demoParentAttendance; break;
    case "parentProgressReport": data=demoParentProgress; break;
    case "parentTranscript": data=demoParentTranscript; break;
    case "listClassStudents": data=usersStudents; break;
    case "listSubmissions": data=[
      {id:"SUB-1",assignment_id:"ASG-1",assignment_title:"Latihan Numerasi #04",student_user_id:"USR-S1",student_name:"Nadia Putri",submitted_at:"2026-08-19T10:00:00+07:00",score:"",feedback:"",status:"SUBMITTED"},
      {id:"SUB-2",assignment_id:"ASG-1",assignment_title:"Latihan Numerasi #04",student_user_id:"USR-S2",student_name:"Rafi Pratama",submitted_at:"2026-08-19T11:00:00+07:00",score:82,feedback:"Perhatikan langkah perhitungan.",status:"GRADED"},
    ]; break;
    case "startExam":
      data={
        attemptId:"ATT-DEMO-1",
        exam:{...exams[0]},
        startedAt:new Date().toISOString(),
        expiresAt:new Date(Date.now()+Number(exams[0].duration_minutes)*60000).toISOString(),
        questions:questions.map((q,i)=>({...q,order_no:i+1,points:1}))
      }; message="Tryout demo dimulai."; break;
    case "submitExam":
      data={score:84,correctCount:2,wrongCount:1,rank:12,percentile:91,analysis:{Numerasi:{correct:1,total:2,accuracy:50},Literasi:{correct:1,total:1,accuracy:100}},review:questions.map((q,i)=>({questionId:q.id,questionText:q.question_text,answer:i===0?"C":i===1?"B":"B",correctAnswer:i===0?"C":i===1?"C":"B",isCorrect:i!==1,explanation:"Pembahasan demo Nalarva."}))};
      message="Tryout demo selesai. Nilai kamu 84."; break;
    case "studentOverview":
      data={progress:50,lastScore:84,rank:12,pendingAssignments:1,classes:1,upcomingSchedules:schedules.slice(0,2),recentMaterials:materials.slice(0,2)}; break;
    case "adminOverview":
      data={students:usersStudents.filter(x=>x.status==="ACTIVE").length,tutors:usersTutors.filter(x=>x.status==="ACTIVE").length,classes:demoClasses.length,exams:exams.filter(x=>x.status==="PUBLISHED").length,registrations:registrations.filter(x=>x.status==="BARU").length,pendingPayments:orders.filter(x=>x.status==="MENUNGGU_PEMBAYARAN").length,paidOrders:orders.filter(x=>x.status==="PAID").length,revenue:orders.filter(x=>["PAID","ACTIVATED"].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0),recentRegistrations:registrations.slice(0,5),upcomingSchedules:schedules.slice(0,5)}; break;
    case "tutorOverview":
      data={classes:demoClasses.length,students:usersStudents.length,pendingSubmissions:1,averageScore:82,upcomingSchedules:schedules.slice(0,5)}; break;
    case "listEnrollments": data=[
      {id:"ENR-1",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",student_user_id:"USR-S1",student_name:"Nadia Putri",student_email:"nadia@example.com",status:"ACTIVE",enrolled_at:"2026-08-10"},
      {id:"ENR-2",class_id:"CLS-SMA-A",class_name:"TKA SMA Intensif A",student_user_id:"USR-S2",student_name:"Rafi Pratama",student_email:"rafi@example.com",status:"ACTIVE",enrolled_at:"2026-08-12"}
    ]; break;
    case "listExamItems": data=questions.map((q,i)=>({...q,id:`EIT-${i+1}`,exam_id:"EXM-1",question_id:q.id,order_no:i+1,points:1})); break;
    case "changePassword": message="Mode demo: password tidak benar-benar diubah."; data={}; break;
    case "adminResetUserPassword": message="Password sementara baru: Nv#DEMO2026!"; data={temporaryPassword:"Nv#DEMO2026!"}; break;
    case "adminUpdateUserStatus": case "adminUpdateEnrollment": case "adminUpdateExamStatus": case "adminRemoveQuestionFromExam": data={}; message="Perubahan demo berhasil."; break;
    default:
      data={id:`DEMO-${Date.now()}`};
  }
  void payload;
  return {ok:true,message,data:data as T};
}
const subscriptions = [
  {id:"SUB-DEMO",user_id:"demo-user",package_id:"PKG-FOCUS",package_name:"TKA Focus",program_id:"PRG-SMA",program_name:"TKA SMA",start_at:"2026-08-01T00:00:00+07:00",end_at:"2026-09-30T23:59:59+07:00",status:"ACTIVE",source:"DEMO",student_name:"Anisa",student_email:"siswa@nalarva.com"},
];
const paymentSettings = {bankName:"",bankAccount:"",bankHolder:"",paymentNote:"Hubungi Admin Nalarva untuk detail pembayaran."};


const demoNotifications = [
  {id:"NOT-DEMO-1",type:"PEMBAYARAN",title:"Pembayaran diterima",message:"Pembayaran paket TKA Focus telah dikonfirmasi.",link:"/dashboard/siswa/langganan",status:"UNREAD",created_at:"2026-08-20T02:00:00+07:00",read_at:""},
  {id:"NOT-DEMO-2",type:"AKADEMIK",title:"Tryout tersedia",message:"Tryout Demo TKA SMA sudah dapat dikerjakan.",link:"/dashboard/siswa/tryout",status:"READ",created_at:"2026-08-19T11:00:00+07:00",read_at:"2026-08-19T12:00:00+07:00"},
];


const calendarEvents = [
  {id:"CAL-1",title:"Tryout TKA SMA #2",description:"Tryout evaluasi bulanan.",type:"TRYOUT",start_at:"2026-08-24T09:00:00+07:00",end_at:"2026-08-24T11:00:00+07:00",program_name:"TKA SMA",class_name:"TKA SMA - Kelas A",status:"ACTIVE"},
  {id:"CAL-2",title:"Kelas Matematika",description:"Pembahasan numerasi dan strategi soal.",type:"KELAS",start_at:"2026-08-21T19:00:00+07:00",end_at:"2026-08-21T20:30:00+07:00",program_name:"TKA SMA",class_name:"TKA SMA - Kelas A",status:"ACTIVE"},
];
const demoMessages = [
  {id:"MSG-1",sender_user_id:"USR-TUTOR",recipient_user_id:"demo-user",other_user_id:"USR-TUTOR",other_name:"Raka Pratama",direction:"IN",subject:"Latihan minggu ini",message:"Silakan fokus pada soal numerasi nomor 1–20.",created_at:"2026-08-20T01:30:00+07:00",read_at:""},
];
const demoProfile = {id:"STU-DEMO",user_id:"demo-user",student_no:"NV-S-0001",name:"Anisa",email:"siswa@nalarva.com",student_phone:"081234567890",birth_date:"2010-05-12",level:"SMA",grade:"XI",school:"SMA Nusantara",city:"Jakarta",address:"",parent_name:"Ibu Anisa",parent_phone:"081234567899",parent_email:"orangtua@example.com",guardian_relation:"ORANG_TUA",program_name:"TKA SMA"};
const demoCertificates = [
  {id:"CRT-DEMO-1",cert_no:"NV-CERT-2026-0001",verification_code:"NV8DEMO1",student_name:"Anisa",exam_title:"Tryout Demo TKA SMA",score:84,rank:12,percentile:88,issued_at:"2026-08-19T12:00:00+07:00"},
];
const demoRecipients = [
  {id:"USR-TUTOR",name:"Raka Pratama",role:"TUTOR",role_label:"Tutor Matematika"},
];


const demoParentChildren = [{id:"demo-user",name:"Anisa",student_no:"NV-S-0001",level:"SMA",school:"SMA Nusantara",program_name:"TKA SMA"}];
const demoParentAttendance = [
  {id:"ATT-P-1",schedule_title:"Kelas Matematika",class_name:"TKA SMA - Kelas A",start_at:"2026-08-18T19:00:00+07:00",status:"HADIR",notes:""},
  {id:"ATT-P-2",schedule_title:"Kelas Literasi",class_name:"TKA SMA - Kelas A",start_at:"2026-08-16T19:00:00+07:00",status:"IZIN",notes:"Kegiatan sekolah"},
];
const demoParentOverview = {student:demoParentChildren[0],attendanceRate:88,attendanceCount:8,averageExamScore:84,examCount:2,assignmentProgress:80,pendingAssignments:1,subscription:{active:true,daysLeft:41,packageName:"TKA Focus"},upcomingSchedules:schedules.slice(0,3),recentResults:results.slice(0,3)};
const demoParentProgress = {student:demoParentChildren[0],periodStart:"2026-08-01T00:00:00+07:00",periodEnd:"2026-08-31T23:59:59+07:00",summary:{attendanceRate:88,assignmentProgress:80,assignmentAverage:86,examAverage:84},results:results,assignments:[{id:"SUB-P-1",assignment_title:"Latihan Numerasi",class_name:"TKA SMA - Kelas A",status:"GRADED",score:86,feedback:"Pemahaman baik."}]};
const demoParentTranscript = {student:demoParentChildren[0],generatedAt:"2026-08-20T03:00:00+07:00",documentNo:"NV-TRX-2026-0001",results:results,assignments:[{id:"SUB-P-1",assignment_title:"Latihan Numerasi",class_name:"TKA SMA - Kelas A",submitted_at:"2026-08-18T10:00:00+07:00",score:86}]};
const demoGuardians = [{link_id:"GUA-DEMO",guardian_user_id:"USR-PARENT",guardian_name:"Ibu Anisa",guardian_email:"orangtua@nalarva.com",guardian_status:"ACTIVE",student_name:"Anisa",student_no:"NV-S-0001",level:"SMA",relation:"IBU",phone:"081234567899"}];


