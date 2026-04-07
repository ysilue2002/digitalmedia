(() => {
  const pseudo = (localStorage.getItem("pseudo") || "").trim();
  const page = window.location.pathname;
  const isAdminPseudo = pseudo.toLowerCase() === "admin";
  const DEFAULT_LANG = "fr";
  const SUPPORTED_LANGS = ["fr", "en", "es", "ar"];
  let currentLang = localStorage.getItem("lang") || DEFAULT_LANG;
  if (isAdminPseudo) currentLang = DEFAULT_LANG;
  if (!SUPPORTED_LANGS.includes(currentLang)) currentLang = DEFAULT_LANG;
  const TRANSLATIONS = {
    fr: {
      "lang.label": "Langue",
      "lang.short": "Langue",
      "common.loading": "Chargement...",
      "common.pseudo": "Pseudo",
      "common.pseudoExample": "ex: Alex",
      "nav.live": "Live",
      "nav.history": "Historique",
      "nav.moderation": "Moderation",
      "nav.changePseudo": "Changer de pseudo",
      "nav.logout": "Deconnexion",
      "login.subtitle": "Entre juste un pseudo pour participer.",
      "home.purposeTitle": "Le debat du jour, version vrai talk",
      "home.purposeBody1":
        "Chaque jour, QDAY balance une question d'actu. Tu reponds, tu commentes, tu debates cash, sans tourner autour du pot.",
      "home.purposeBody2":
        "Pas d'inscription longue: un pseudo et c'est parti. Espace modere, echanges plus safe, opinions assumees.",
      "home.purposeCta": "Pose ton pseudo et entre dans le feed du debat.",
      "login.submit": "Se connecter",
      "adminLogin.subtitle": "Acces reserve a l'administration.",
      "adminLogin.password": "Mot de passe admin",
      "adminLogin.submit": "Se connecter en admin",
      "adminLogin.backToUser": "Retour connexion utilisateur",
      "ads.label": "Publicite",
      "ads.spaceTitle": "Espace publicitaire",
      "ads.spaceBody": "Cet espace est configure par l'administrateur.",
      "live.currentQuestion": "Question en cours",
      "live.yourAnswer": "Ta reponse",
      "live.sendAnswer": "Envoyer la reponse",
      "live.liveAnswers": "Reponses en direct",
      "admin.newQuestionTitle": "Admin: nouvelle question",
      "admin.questionLabel": "Question",
      "admin.publish": "Publier",
      "admin.adsTitle": "Admin: publicites",
      "admin.slot": "Emplacement",
      "admin.label": "Label",
      "admin.title": "Titre",
      "admin.content": "Contenu",
      "admin.start": "Debut",
      "admin.end": "Fin",
      "admin.media": "Media (image, video, pdf, autre)",
      "admin.saveAd": "Enregistrer la pub",
      "admin.activeAds": "Pubs actives",
      "admin.noAds": "Aucune pub configuree.",
      "history.oldQuestions": "Anciennes questions",
      "history.selectQuestion": "Selectionne une question",
      "history.intervene": "Intervenir sur cette question",
      "history.answersCount": "{count} reponse(s)",
      "mod.title": "Moderation",
      "mod.subtitle": "Liste des signalements recents et actions en un clic.",
      "mod.search": "Recherche instantanee...",
      "mod.status.open": "Ouverts",
      "mod.status.all": "Tous statuts",
      "mod.status.resolved": "Resolus",
      "mod.status.dismissed": "Ignores",
      "mod.type.all": "Tous types",
      "mod.type.answer": "Reponses",
      "mod.type.comment": "Commentaires",
      "mod.author.all": "Tous auteurs",
      "mod.sort.dateDesc": "Date (recent -> ancien)",
      "mod.sort.dateAsc": "Date (ancien -> recent)",
      "mod.sort.authorAsc": "Auteur (A -> Z)",
      "mod.sort.typeAsc": "Type (A -> Z)",
      "mod.sort.statusAsc": "Statut (A -> Z)",
      "mod.refresh": "Rafraichir",
      "title.index": "Connexion - QDay",
      "title.admin": "Connexion Admin - QDay",
      "title.live": "Question Live - QDay",
      "title.history": "Historique - QDay",
      "title.moderation": "Moderation Admin - QDay",
      "ui.noAnswers": "Aucune reponse pour le moment.",
      "ui.commentAnswer": "Commenter cette reponse",
      "ui.commentPlaceholder": "Ton commentaire",
      "ui.commentBtn": "Commenter",
      "ui.report": "Signaler",
      "ui.delete": "Supprimer",
      "ui.loadMore": "Charger plus ({count} restantes)",
      "ui.typing.one": "{a} est en train d'ecrire...",
      "ui.typing.two": "{a} et {b} sont en train d'ecrire...",
      "ui.typing.many": "{a}, {b} et {n} autres ecrivent...",
      "ui.noReports": "Aucun signalement.",
      "ui.noDetails": "Aucun detail.",
      "ui.resolve": "Resoudre",
      "ui.dismiss": "Ignorer",
      "ui.deleteContent": "Supprimer contenu",
      "ui.reportSent": "Signalement envoye.",
      "ui.adminRequired": "Acces admin requis.",
      "ui.useAdminPage": "Pour l'administration, utilise la page /admin.html",
      "ui.invalidAdminSession": "Session admin invalide. Reconnecte-toi.",
      "ui.statusCurrent": "Question en cours",
      "ui.statusArchived": "Question archivee",
      "ui.noQuestion": "Aucune question.",
      "ui.noActiveQuestion": "Aucune question active.",
      "ui.emptyAdSlot": "Aucun media actif sur cet emplacement.",
      "ui.saveDateError": "La date de fin doit etre apres la date de debut.",
      "ui.uploadError": "Erreur upload media.",
      "ui.adminLoginDenied": "Connexion admin refusee.",
      "ui.adminPasswordRequired": "Mot de passe admin requis.",
      "ui.shareQuestion": "Partager cette question",
      "ui.shareSuccess": "Lien copie. Tu peux le partager.",
      "ui.shareUnsupported": "Partage indisponible sur cet appareil.",
      "ui.media.image": "[Image]",
      "ui.media.video": "[Video]",
      "share.header": "QDAY - Question du jour",
      "share.prompt": "Ton avis en 30 secondes.",
      "share.flow": "Pseudo + reponse + debat direct.",
      "share.join": "Participe ici:",
      "contact.label": "Contact",
      "footer.rights": "tous droits reservés à SYM_CI",
      "warn.open": "Voir les regles de communaute",
      "warn.title": "Avertissement important : regles de communaute",
      "warn.intro":
        "L'utilisation de Qday est soumise au respect strict de nos standards de conduite. Nous promouvons un espace d'echange securise, respectueux et constructif pour tous.",
      "warn.zero": "Tolerance zero",
      "warn.item1":
        "Appels a la haine : tout propos discriminatoire lie a l'origine, la religion, le genre, l'orientation sexuelle ou le handicap.",
      "warn.item2":
        "Incitations a la violence et au meurtre : menaces directes ou indirectes contre la securite d'autrui.",
      "warn.item3":
        "Harcelement et cyber-intimidation : comportements abusifs visant a humilier ou traquer un utilisateur.",
      "warn.item4": "Contenus illegaux : partage de contenus faisant l'apologie de crimes ou de delits.",
      "warn.consequences": "Consequences",
      "warn.ban": "Bannissement definitif : votre compte sera supprime sans preavis ni recours.",
      "warn.note":
        "Note : la liberte d'expression ne justifie en aucun cas l'agression. En restant sur ce site, vous vous engagez a respecter l'integrite de chacun.",
      "warn.close": "Fermer",
      "warn.ok": "J'ai compris",
    },
    en: {
      "lang.label": "Language",
      "lang.short": "Lang",
      "common.loading": "Loading...",
      "common.pseudo": "Nickname",
      "common.pseudoExample": "e.g. Alex",
      "nav.live": "Live",
      "nav.history": "History",
      "nav.moderation": "Moderation",
      "nav.changePseudo": "Change nickname",
      "nav.logout": "Logout",
      "login.subtitle": "Enter a nickname to join.",
      "home.purposeTitle": "Today's hot topic, no fake talk",
      "home.purposeBody1":
        "Every day, QDAY drops one trending question. You answer, comment, and debate directly with zero dodging.",
      "home.purposeBody2":
        "No long signup flow: pick a nickname and jump in. Moderated space, safer vibes, real opinions.",
      "home.purposeCta": "Drop your nickname and join the debate feed.",
      "login.submit": "Sign in",
      "adminLogin.subtitle": "Admin access only.",
      "adminLogin.password": "Admin password",
      "adminLogin.submit": "Sign in as admin",
      "adminLogin.backToUser": "Back to user login",
      "ads.label": "Ad",
      "ads.spaceTitle": "Ad space",
      "ads.spaceBody": "This slot is managed by the administrator.",
      "live.currentQuestion": "Current question",
      "live.yourAnswer": "Your answer",
      "live.sendAnswer": "Send answer",
      "live.liveAnswers": "Live answers",
      "history.oldQuestions": "Past questions",
      "history.selectQuestion": "Select a question",
      "history.intervene": "Reply to this question",
      "history.answersCount": "{count} answer(s)",
      "mod.title": "Moderation",
      "mod.subtitle": "Recent reports and one-click actions.",
      "mod.search": "Instant search...",
      "mod.status.open": "Open",
      "mod.status.all": "All statuses",
      "mod.status.resolved": "Resolved",
      "mod.status.dismissed": "Dismissed",
      "mod.type.all": "All types",
      "mod.type.answer": "Answers",
      "mod.type.comment": "Comments",
      "mod.author.all": "All authors",
      "mod.sort.dateDesc": "Date (newest -> oldest)",
      "mod.sort.dateAsc": "Date (oldest -> newest)",
      "mod.sort.authorAsc": "Author (A -> Z)",
      "mod.sort.typeAsc": "Type (A -> Z)",
      "mod.sort.statusAsc": "Status (A -> Z)",
      "mod.refresh": "Refresh",
      "admin.noAds": "No ads configured.",
      "title.index": "Login - QDay",
      "title.admin": "Admin Login - QDay",
      "title.live": "Live Question - QDay",
      "title.history": "History - QDay",
      "title.moderation": "Admin Moderation - QDay",
      "ui.noAnswers": "No answers yet.",
      "ui.commentAnswer": "Comment on this answer",
      "ui.commentPlaceholder": "Your comment",
      "ui.commentBtn": "Comment",
      "ui.report": "Report",
      "ui.delete": "Delete",
      "ui.loadMore": "Load more ({count} left)",
      "ui.typing.one": "{a} is typing...",
      "ui.typing.two": "{a} and {b} are typing...",
      "ui.typing.many": "{a}, {b} and {n} others are typing...",
      "ui.noReports": "No reports.",
      "ui.noDetails": "No details.",
      "ui.resolve": "Resolve",
      "ui.dismiss": "Dismiss",
      "ui.deleteContent": "Delete content",
      "ui.reportSent": "Report sent.",
      "ui.adminRequired": "Admin access required.",
      "ui.useAdminPage": "For administration, use /admin.html",
      "ui.invalidAdminSession": "Invalid admin session. Please log in again.",
      "ui.statusCurrent": "Current question",
      "ui.statusArchived": "Archived question",
      "ui.noQuestion": "No question.",
      "ui.noActiveQuestion": "No active question.",
      "ui.emptyAdSlot": "No media active for this slot.",
      "ui.saveDateError": "End date must be after start date.",
      "ui.uploadError": "Media upload error.",
      "ui.adminLoginDenied": "Admin login denied.",
      "ui.adminPasswordRequired": "Admin password required.",
      "ui.shareQuestion": "Share this question",
      "ui.shareSuccess": "Link copied. You can share it now.",
      "ui.shareUnsupported": "Sharing is not available on this device.",
      "ui.media.image": "[Image]",
      "ui.media.video": "[Video]",
      "share.header": "QDAY - Daily question",
      "share.prompt": "Your take in 30 seconds.",
      "share.flow": "Nickname + answer + real debate.",
      "share.join": "Join here:",
      "contact.label": "Contact",
      "footer.rights": "All rights reserved to SYM_CI",
      "warn.open": "View community rules",
      "warn.title": "Important warning: community rules",
      "warn.intro":
        "Using Qday requires strict respect of our conduct standards. We promote a safe, respectful and constructive space for everyone.",
      "warn.zero": "Zero tolerance",
      "warn.item1":
        "Hate speech: discriminatory content related to origin, religion, gender, sexual orientation or disability.",
      "warn.item2": "Violence and murder incitement: direct or indirect threats against others' safety.",
      "warn.item3": "Harassment and cyberbullying: abusive behavior intended to humiliate or target a user.",
      "warn.item4": "Illegal content: sharing content that glorifies crimes or offenses.",
      "warn.consequences": "Consequences",
      "warn.ban": "Permanent ban: your account may be removed without notice and without appeal.",
      "warn.note":
        "Note: freedom of expression never justifies aggression. By staying on this site, you commit to respecting everyone's integrity.",
      "warn.close": "Close",
      "warn.ok": "I understand",
    },
    es: {
      "lang.label": "Idioma",
      "lang.short": "Idioma",
      "common.loading": "Cargando...",
      "common.pseudo": "Alias",
      "common.pseudoExample": "ej: Alex",
      "nav.live": "En vivo",
      "nav.history": "Historial",
      "nav.moderation": "Moderacion",
      "nav.changePseudo": "Cambiar alias",
      "nav.logout": "Cerrar sesion",
      "login.subtitle": "Ingresa un alias para participar.",
      "home.purposeTitle": "El debate del dia, sin filtro",
      "home.purposeBody1":
        "Cada dia, QDAY lanza una pregunta en tendencia. Respondes, comentas y debates de frente, sin evasivas.",
      "home.purposeBody2":
        "Sin registro largo: solo un alias y entras. Espacio moderado, mas seguro y con opiniones reales.",
      "home.purposeCta": "Pon tu alias y entra al feed del debate.",
      "login.submit": "Conectarse",
      "adminLogin.subtitle": "Acceso solo para administracion.",
      "adminLogin.password": "Contrasena admin",
      "adminLogin.submit": "Entrar como admin",
      "adminLogin.backToUser": "Volver al acceso usuario",
      "ads.label": "Publicidad",
      "ads.spaceTitle": "Espacio publicitario",
      "ads.spaceBody": "Este espacio lo gestiona el administrador.",
      "live.currentQuestion": "Pregunta actual",
      "live.yourAnswer": "Tu respuesta",
      "live.sendAnswer": "Enviar respuesta",
      "live.liveAnswers": "Respuestas en vivo",
      "history.oldQuestions": "Preguntas anteriores",
      "history.selectQuestion": "Selecciona una pregunta",
      "history.intervene": "Participar en esta pregunta",
      "history.answersCount": "{count} respuesta(s)",
      "mod.title": "Moderacion",
      "mod.subtitle": "Lista de reportes recientes y acciones rapidas.",
      "mod.search": "Busqueda instantanea...",
      "mod.status.open": "Abiertos",
      "mod.status.all": "Todos los estados",
      "mod.status.resolved": "Resueltos",
      "mod.status.dismissed": "Ignorados",
      "mod.type.all": "Todos los tipos",
      "mod.type.answer": "Respuestas",
      "mod.type.comment": "Comentarios",
      "mod.author.all": "Todos los autores",
      "mod.sort.dateDesc": "Fecha (reciente -> antiguo)",
      "mod.sort.dateAsc": "Fecha (antiguo -> reciente)",
      "mod.sort.authorAsc": "Autor (A -> Z)",
      "mod.sort.typeAsc": "Tipo (A -> Z)",
      "mod.sort.statusAsc": "Estado (A -> Z)",
      "mod.refresh": "Actualizar",
      "admin.noAds": "No hay publicidad configurada.",
      "title.index": "Conexion - QDay",
      "title.admin": "Conexion Admin - QDay",
      "title.live": "Pregunta en Vivo - QDay",
      "title.history": "Historial - QDay",
      "title.moderation": "Moderacion Admin - QDay",
      "ui.noAnswers": "Aun no hay respuestas.",
      "ui.commentAnswer": "Comentar esta respuesta",
      "ui.commentPlaceholder": "Tu comentario",
      "ui.commentBtn": "Comentar",
      "ui.report": "Reportar",
      "ui.delete": "Eliminar",
      "ui.loadMore": "Cargar mas ({count} restantes)",
      "ui.typing.one": "{a} esta escribiendo...",
      "ui.typing.two": "{a} y {b} estan escribiendo...",
      "ui.typing.many": "{a}, {b} y {n} mas estan escribiendo...",
      "ui.noReports": "No hay reportes.",
      "ui.noDetails": "Sin detalles.",
      "ui.resolve": "Resolver",
      "ui.dismiss": "Ignorar",
      "ui.deleteContent": "Eliminar contenido",
      "ui.reportSent": "Reporte enviado.",
      "ui.adminRequired": "Acceso admin requerido.",
      "ui.useAdminPage": "Para administracion, usa /admin.html",
      "ui.invalidAdminSession": "Sesion admin invalida. Vuelve a conectarte.",
      "ui.statusCurrent": "Pregunta actual",
      "ui.statusArchived": "Pregunta archivada",
      "ui.noQuestion": "No hay preguntas.",
      "ui.noActiveQuestion": "No hay pregunta activa.",
      "ui.emptyAdSlot": "No hay media activa para este espacio.",
      "ui.saveDateError": "La fecha final debe ser posterior a la inicial.",
      "ui.uploadError": "Error de carga del media.",
      "ui.adminLoginDenied": "Acceso admin rechazado.",
      "ui.adminPasswordRequired": "Contrasena admin obligatoria.",
      "ui.shareQuestion": "Compartir esta pregunta",
      "ui.shareSuccess": "Enlace copiado. Ya puedes compartirlo.",
      "ui.shareUnsupported": "Compartir no esta disponible en este dispositivo.",
      "ui.media.image": "[Imagen]",
      "ui.media.video": "[Video]",
      "share.header": "QDAY - Pregunta del dia",
      "share.prompt": "Tu opinion en 30 segundos.",
      "share.flow": "Alias + respuesta + debate directo.",
      "share.join": "Participa aqui:",
      "contact.label": "Contacto",
      "footer.rights": "Todos los derechos reservados a SYM_CI",
      "warn.open": "Ver reglas de la comunidad",
      "warn.title": "Advertencia importante: reglas de la comunidad",
      "warn.intro":
        "El uso de Qday exige respetar estrictamente nuestros estandares de conducta. Promovemos un espacio seguro, respetuoso y constructivo para todos.",
      "warn.zero": "Tolerancia cero",
      "warn.item1":
        "Discurso de odio: contenido discriminatorio por origen, religion, genero, orientacion sexual o discapacidad.",
      "warn.item2": "Incitacion a la violencia y al asesinato: amenazas directas o indirectas contra la seguridad de otros.",
      "warn.item3":
        "Acoso y ciberacoso: comportamientos abusivos para humillar o perseguir a un usuario.",
      "warn.item4": "Contenido ilegal: difusion de contenido que haga apologia de delitos o crimenes.",
      "warn.consequences": "Consecuencias",
      "warn.ban": "Bloqueo definitivo: tu cuenta puede ser eliminada sin aviso previo ni recurso.",
      "warn.note":
        "Nota: la libertad de expresion no justifica la agresion. Al permanecer en este sitio, aceptas respetar la integridad de todos.",
      "warn.close": "Cerrar",
      "warn.ok": "Entendido",
    },
    ar: {
      "lang.label": "اللغة",
      "lang.short": "اللغة",
      "common.loading": "جاري التحميل...",
      "common.pseudo": "الاسم المستعار",
      "common.pseudoExample": "مثال: Alex",
      "nav.live": "مباشر",
      "nav.history": "الأرشيف",
      "nav.moderation": "الإشراف",
      "nav.changePseudo": "تغيير الاسم",
      "nav.logout": "تسجيل الخروج",
      "login.subtitle": "أدخل اسما مستعارا للمشاركة.",
      "home.purposeTitle": "نقاش اليوم بدون لف ولا دوران",
      "home.purposeBody1":
        "كل يوم، QDAY يطرح سؤالا ترند. جاوب وعلّق وناقش بشكل مباشر وبدون مراوغة.",
      "home.purposeBody2":
        "بدون تسجيل طويل: اسم مستعار فقط وتدخل مباشرة. مساحة خاضعة للإشراف، أكثر أمانا وآراء حقيقية.",
      "home.purposeCta": "اكتب اسمك المستعار وادخل فورا في نقاش اليوم.",
      "login.submit": "دخول",
      "adminLogin.subtitle": "ولوج مخصص للإدارة.",
      "adminLogin.password": "كلمة مرور الإدارة",
      "adminLogin.submit": "دخول كمسؤول",
      "adminLogin.backToUser": "العودة لدخول المستخدم",
      "ads.label": "إعلان",
      "ads.spaceTitle": "مساحة إعلانية",
      "ads.spaceBody": "هذا المكان تتم إدارته من طرف المسؤول.",
      "live.currentQuestion": "السؤال الحالي",
      "live.yourAnswer": "إجابتك",
      "live.sendAnswer": "إرسال الإجابة",
      "live.liveAnswers": "الإجابات المباشرة",
      "history.oldQuestions": "الأسئلة السابقة",
      "history.selectQuestion": "اختر سؤالا",
      "history.intervene": "شارك في هذا السؤال",
      "history.answersCount": "{count} إجابة",
      "title.index": "تسجيل الدخول - QDAY",
      "title.admin": "دخول الإدارة - QDAY",
      "title.live": "السؤال المباشر - QDAY",
      "title.history": "الأرشيف - QDAY",
      "title.moderation": "إشراف الإدارة - QDAY",
      "ui.noAnswers": "لا توجد إجابات حاليا.",
      "ui.commentAnswer": "علّق على هذه الإجابة",
      "ui.commentPlaceholder": "تعليقك",
      "ui.commentBtn": "تعليق",
      "ui.report": "إبلاغ",
      "ui.delete": "حذف",
      "ui.loadMore": "تحميل المزيد ({count} متبقية)",
      "ui.typing.one": "{a} يكتب الآن...",
      "ui.typing.two": "{a} و {b} يكتبان الآن...",
      "ui.typing.many": "{a} و {b} و {n} آخرون يكتبون...",
      "ui.reportSent": "تم إرسال البلاغ.",
      "ui.adminRequired": "وصول الإدارة مطلوب.",
      "ui.useAdminPage": "للإدارة استخدم الصفحة /admin.html",
      "ui.invalidAdminSession": "جلسة الإدارة غير صالحة. سجل الدخول من جديد.",
      "ui.statusCurrent": "السؤال الحالي",
      "ui.statusArchived": "سؤال مؤرشف",
      "ui.noQuestion": "لا يوجد سؤال.",
      "ui.noActiveQuestion": "لا يوجد سؤال نشط.",
      "ui.emptyAdSlot": "لا يوجد ملف وسائط نشط لهذا الموضع.",
      "ui.saveDateError": "تاريخ النهاية يجب أن يكون بعد تاريخ البداية.",
      "ui.uploadError": "خطأ في رفع الوسائط.",
      "ui.adminLoginDenied": "تم رفض دخول الإدارة.",
      "ui.adminPasswordRequired": "كلمة مرور الإدارة مطلوبة.",
      "ui.shareQuestion": "مشاركة هذا السؤال",
      "ui.shareSuccess": "تم نسخ الرابط. يمكنك مشاركته الآن.",
      "ui.shareUnsupported": "المشاركة غير متاحة على هذا الجهاز.",
      "ui.media.image": "[صورة]",
      "ui.media.video": "[فيديو]",
      "share.header": "QDAY - سؤال اليوم",
      "share.prompt": "رأيك في 30 ثانية.",
      "share.flow": "اسم مستعار + إجابة + نقاش مباشر.",
      "share.join": "شارك هنا:",
      "contact.label": "اتصال",
      "footer.rights": "جميع الحقوق محفوظة لـ SYM_CI",
      "warn.open": "عرض قواعد المجتمع",
      "warn.title": "تنبيه مهم: قواعد المجتمع",
      "warn.intro":
        "استخدام Qday يخضع لاحترام صارم لمعايير السلوك. نحن ندعم مساحة آمنة ومحترمة وبنّاءة لجميع المستخدمين.",
      "warn.zero": "عدم التسامح مطلقا",
      "warn.item1":
        "خطاب الكراهية: أي محتوى تمييزي مرتبط بالأصل أو الدين أو الجنس أو التوجه الجنسي أو الإعاقة.",
      "warn.item2": "التحريض على العنف والقتل: تهديدات مباشرة أو غير مباشرة ضد سلامة الآخرين.",
      "warn.item3": "التحرش والتنمر الإلكتروني: سلوك مسيء يهدف إلى إذلال أو ملاحقة مستخدم.",
      "warn.item4": "محتوى غير قانوني: نشر محتوى يمجد الجرائم أو الجنح.",
      "warn.consequences": "العواقب",
      "warn.ban": "حظر نهائي: قد يتم حذف حسابك دون إشعار مسبق ودون إمكانية طعن.",
      "warn.note":
        "ملاحظة: حرية التعبير لا تبرر الاعتداء. بالاستمرار في هذا الموقع، أنت تلتزم باحترام كرامة الجميع.",
      "warn.close": "إغلاق",
      "warn.ok": "فهمت",
    },
  };

  const SLOT_LABELS = {
    "login-main": "Connexion",
    "live-top": "Live haut",
    "live-bottom-left": "Live bas gauche",
    "live-bottom-right": "Live bas droite",
    "history-left-top": "Historique gauche",
    "history-right-bottom": "Historique bas droite",
  };
  const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "🙏", "🎉", "😮", "😢", "😡"];
  const ANSWERS_PAGE_SIZE = 6;
  let latestAds = [];
  const visibleAnswersByQuestion = new Map();
  let hasAdminRights = false;
  const typingMap = new Map();
  let currentLiveQuestionId = null;
  let currentHistoryQuestionId = null;
  let reportsCache = [];
  const moderationState = {
    search: "",
    status: "open",
    type: "all",
    author: "all",
    sort: "date_desc",
  };

  if (!pseudo && page !== "/index.html" && page !== "/" && page !== "/admin.html") {
    window.location.href = "/index.html";
    return;
  }

  const socket = io();
  const userBadge = document.getElementById("user-badge");
  if (userBadge) userBadge.textContent = `Pseudo: ${pseudo || "-"}`;

  document.querySelectorAll(".logout-link").forEach((link) => {
    link.addEventListener("click", async () => {
      localStorage.removeItem("pseudo");
      try {
        await fetch("/api/admin/logout", { method: "POST" });
      } catch {}
    });
  });

  function updateAdminLinksVisibility() {
    document.querySelectorAll(".admin-only-link").forEach((el) => {
      el.hidden = !hasAdminRights;
    });
  }
  updateAdminLinksVisibility();

  function t(key, vars = {}) {
    const dict = TRANSLATIONS[currentLang] || TRANSLATIONS[DEFAULT_LANG];
    const fallback = TRANSLATIONS[DEFAULT_LANG][key] || key;
    let text = dict[key] || fallback;
    Object.keys(vars).forEach((k) => {
      text = text.replaceAll(`{${k}}`, String(vars[k]));
    });
    return text;
  }

  function getLocale() {
    if (currentLang === "en") return "en-US";
    if (currentLang === "es") return "es-ES";
    if (currentLang === "ar") return "ar-SA";
    return "fr-FR";
  }

  function applyStaticTranslations() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === "ar" ? "rtl" : "ltr";
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (!key) return;
      el.textContent = t(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (!key) return;
      el.setAttribute("placeholder", t(key));
    });
    document.querySelectorAll(".lang-switcher").forEach((el) => {
      if (el.value !== currentLang) el.value = currentLang;
    });
    document.querySelectorAll(".flag-lang-btn").forEach((btn) => {
      const isActive = btn.getAttribute("data-lang") === currentLang;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    if (page === "/" || page === "/index.html") document.title = t("title.index");
    if (page === "/admin.html") document.title = t("title.admin");
    if (page === "/live.html") document.title = t("title.live");
    if (page === "/history.html") document.title = t("title.history");
    if (page === "/admin-moderation.html") document.title = t("title.moderation");
  }

  function setLang(next) {
    if (isAdminPseudo) {
      currentLang = DEFAULT_LANG;
      localStorage.setItem("lang", DEFAULT_LANG);
      applyStaticTranslations();
      return;
    }
    if (!SUPPORTED_LANGS.includes(next)) return;
    currentLang = next;
    localStorage.setItem("lang", next);
    applyStaticTranslations();
    renderTypingIndicators();
    window.dispatchEvent(new Event("qday:lang-changed"));
  }

  document.querySelectorAll(".lang-switcher").forEach((el) => {
    el.value = currentLang;
    if (isAdminPseudo) {
      el.value = DEFAULT_LANG;
      el.disabled = true;
    }
    el.addEventListener("change", () => setLang(el.value));
  });
  document.querySelectorAll(".flag-lang-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lang = btn.getAttribute("data-lang") || "";
      setLang(lang);
    });
  });
  applyStaticTranslations();

  socket.on("action:error", (message) => {
    const questionNotFound =
      currentLang === "en"
        ? "Question not found."
        : currentLang === "es"
        ? "Pregunta no encontrada."
        : currentLang === "ar"
        ? "السؤال غير موجود."
        : null;
    const answerNotFound =
      currentLang === "en"
        ? "Answer not found."
        : currentLang === "es"
        ? "Respuesta no encontrada."
        : currentLang === "ar"
        ? "الإجابة غير موجودة."
        : null;
    const commentNotFound =
      currentLang === "en"
        ? "Comment not found."
        : currentLang === "es"
        ? "Comentario no encontrado."
        : currentLang === "ar"
        ? "التعليق غير موجود."
        : null;
    const map = {
      "Acces admin requis.": "ui.adminRequired",
      "Question introuvable.": questionNotFound,
      "Reponse introuvable.": answerNotFound,
      "Commentaire introuvable.": commentNotFound,
      "La date de fin doit etre apres la date de debut.": "ui.saveDateError",
      "Acces admin requis": "ui.adminRequired",
    };
    const m = String(message || "");
    if (map[m] === "ui.adminRequired") {
      alert(t("ui.adminRequired"));
      return;
    }
    if (map[m] === "ui.saveDateError") {
      alert(t("ui.saveDateError"));
      return;
    }
    if (typeof map[m] === "string") {
      alert(map[m]);
      return;
    }
    alert(m);
  });

  socket.on("typing:update", (payload) => {
    const questionId = String(payload?.questionId || "");
    const author = String(payload?.author || "").trim();
    if (!questionId || !author || author === pseudo) return;
    const answerId = String(payload?.answerId || "");
    const target = payload?.target === "comment" ? "comment" : "answer";
    const key = `${questionId}:${answerId}:${target}:${author}`;
    if (payload?.isTyping) typingMap.set(key, { questionId, answerId, target, author, ts: Date.now() });
    else typingMap.delete(key);
    renderTypingIndicators();
  });

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleString(getLocale());
    } catch {
      return iso;
    }
  }

  function toInputDateTimeValue(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
      d.getMinutes()
    )}`;
  }

  function fromInputDateTimeValue(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return d.toISOString();
  }

  function isAdVisibleNow(ad) {
    const now = Date.now();
    const start = new Date(ad.startsAt || ad.createdAt || 0).getTime();
    const end = ad.endsAt ? new Date(ad.endsAt).getTime() : Number.POSITIVE_INFINITY;
    if (Number.isFinite(start) && now < start) return false;
    if (Number.isFinite(end) && now >= end) return false;
    return true;
  }

  function formatSize(size) {
    const n = Number(size || 0);
    if (!n) return "";
    if (n > 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    if (n > 1024) return `${Math.round(n / 1024)} KB`;
    return `${n} B`;
  }

  function insertAtCursor(inputEl, value) {
    const text = String(value || "");
    const start = Number.isInteger(inputEl.selectionStart) ? inputEl.selectionStart : inputEl.value.length;
    const end = Number.isInteger(inputEl.selectionEnd) ? inputEl.selectionEnd : inputEl.value.length;
    const before = inputEl.value.slice(0, start);
    const after = inputEl.value.slice(end);
    inputEl.value = `${before}${text}${after}`;
    const next = start + text.length;
    inputEl.focus();
    inputEl.setSelectionRange(next, next);
  }

  function createEmojiBar(inputEl) {
    const bar = document.createElement("div");
    bar.className = "emoji-bar";
    QUICK_EMOJIS.forEach((emoji) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "emoji-btn";
      btn.textContent = emoji;
      btn.title = `Ajouter ${emoji}`;
      btn.addEventListener("click", () => insertAtCursor(inputEl, emoji));
      bar.appendChild(btn);
    });
    return bar;
  }

  function setupTypingEmitter(inputEl, payloadFactory) {
    if (!inputEl) return;
    let typing = false;
    let timer = null;
    const stopDelayMs = 1200;

    const stop = () => {
      if (!typing) return;
      typing = false;
      socket.emit("typing:stop", payloadFactory());
    };

    inputEl.addEventListener("input", () => {
      const value = inputEl.value.trim();
      if (value && !typing) {
        typing = true;
        socket.emit("typing:start", payloadFactory());
      }
      if (!value) {
        stop();
        if (timer) clearTimeout(timer);
        return;
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(stop, stopDelayMs);
    });

    inputEl.form?.addEventListener("submit", () => {
      if (timer) clearTimeout(timer);
      stop();
    });
  }

  function typingTextFor(questionId, target) {
    const now = Date.now();
    const names = [];
    for (const value of typingMap.values()) {
      if (value.questionId !== questionId) continue;
      if (target && value.target !== target) continue;
      if (now - value.ts > 12_000) continue;
      if (!names.includes(value.author)) names.push(value.author);
    }
    if (!names.length) return "";
    if (names.length === 1) return t("ui.typing.one", { a: names[0] });
    if (names.length === 2) return t("ui.typing.two", { a: names[0], b: names[1] });
    return t("ui.typing.many", { a: names[0], b: names[1], n: names.length - 2 });
  }

  function renderTypingIndicators() {
    const liveEl = document.getElementById("typing-indicator-live");
    if (liveEl) liveEl.textContent = currentLiveQuestionId ? typingTextFor(currentLiveQuestionId, "answer") : "";
    const historyEl = document.getElementById("typing-indicator-history");
    if (historyEl) historyEl.textContent = currentHistoryQuestionId ? typingTextFor(currentHistoryQuestionId, "answer") : "";
  }

  function askReportPayload(targetLabel) {
    const reason = prompt(`Raison du signalement (${targetLabel})`, "Contenu inapproprie");
    if (!reason) return null;
    const details = prompt("Details (optionnel)", "") || "";
    return { reason: reason.trim(), details: details.trim() };
  }

  function reportType(report) {
    return report?.commentId ? "comment" : "answer";
  }

  function normalizeLang(value) {
    const safe = String(value || "").trim().toLowerCase();
    return SUPPORTED_LANGS.includes(safe) ? safe : DEFAULT_LANG;
  }

  function textForLang(node) {
    if (!node) return "";
    const texts = node && typeof node.texts === "object" ? node.texts : null;
    if (texts) {
      const txt = texts[currentLang] || node.text || "";
      if (txt) return txt;
      const asset = mediaAssetForLang(node);
      if (asset?.kind === "video") return t("ui.media.video");
      if (asset?.kind === "image") return t("ui.media.image");
      return "";
    }
    return node.text || "";
  }

  function mediaAssetForLang(question) {
    if (!question || typeof question !== "object") return null;
    const media = question && typeof question.media === "object" ? question.media : null;
    const asset = media?.[currentLang]?.asset || media?.[DEFAULT_LANG]?.asset || null;
    if (!asset || typeof asset.url !== "string" || !asset.url) return null;
    return asset;
  }

  function renderQuestionMedia(question, container) {
    if (!container) return;
    container.textContent = "";
    const asset = mediaAssetForLang(question);
    if (!asset) return;

    if (asset.kind === "image") {
      const img = document.createElement("img");
      img.src = asset.url;
      img.alt = asset.name || "image";
      img.loading = "lazy";
      img.decoding = "async";
      container.appendChild(img);
      return;
    }

    if (asset.kind === "video") {
      const video = document.createElement("video");
      video.src = asset.url;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      container.appendChild(video);
    }
  }

  async function shareQuestion(question, mode = "live") {
    if (!question?.id) return;
    const activeQuestion = textForLang(question) || t("live.currentQuestion");
    const url = window.location.origin.endsWith("/") ? window.location.origin : `${window.location.origin}/`;
    const text =
      `${t("share.header")}\n` +
      `"${activeQuestion}"\n` +
      `${t("share.prompt")}\n` +
      `${t("share.flow")}\n` +
      `${t("share.join")} ${url}\n` +
      `#QDAY #QuestionDuJour #Debat`;

    if (navigator.share) {
      try {
        await navigator.share({ title: t("share.header"), text, url });
        return;
      } catch {}
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        alert(t("ui.shareSuccess"));
        return;
      } catch {}
    }
    alert(t("ui.shareUnsupported"));
  }

  function makeAdAssetNode(asset) {
    if (!asset || !asset.url) return null;
    const wrapper = document.createElement("div");
    wrapper.className = "ad-asset";

    if (asset.kind === "image") {
      const img = document.createElement("img");
      img.src = asset.url;
      img.alt = asset.name || "media publicitaire";
      img.className = "ad-asset-image";
      wrapper.appendChild(img);
      return wrapper;
    }
    if (asset.kind === "video") {
      const video = document.createElement("video");
      video.src = asset.url;
      video.controls = true;
      video.preload = "metadata";
      video.className = "ad-asset-video";
      wrapper.appendChild(video);
      return wrapper;
    }

    const link = document.createElement("a");
    link.href = asset.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = asset.kind === "pdf" ? "Ouvrir le PDF" : "Telecharger le fichier";
    wrapper.appendChild(link);
    return wrapper;
  }

  function renderAds(ads) {
    latestAds = Array.isArray(ads) ? ads : [];
    const bySlot = {};
    latestAds.forEach((ad) => {
      bySlot[ad.slot] = ad;
    });

    document.querySelectorAll("[data-ad-slot]").forEach((element) => {
      const slot = element.getAttribute("data-ad-slot");
      const ad = bySlot[slot] && isAdVisibleNow(bySlot[slot]) ? bySlot[slot] : null;
      const labelEl = element.querySelector(".ad-label");
      const titleEl = element.querySelector(".ad-title");
      const copyEl = element.querySelector(".ad-copy");
      if (!labelEl || !titleEl || !copyEl) return;

      const existingAssetNode = element.querySelector(".ad-asset");
      if (existingAssetNode) existingAssetNode.remove();

      if (!ad) {
        labelEl.textContent = t("ads.label");
        titleEl.textContent = t("ads.spaceTitle");
        copyEl.textContent = t("ads.spaceBody");
        return;
      }
      labelEl.textContent = ad.label || t("ads.label");
      titleEl.textContent = ad.title || t("ads.spaceTitle");
      copyEl.textContent = ad.copy || "";
      const assetNode = makeAdAssetNode(ad.asset);
      if (assetNode) copyEl.insertAdjacentElement("afterend", assetNode);
    });
  }

  socket.on("ads:list", (ads) => {
    renderAds(ads);
    if (page === "/live.html" && isAdminPseudo) renderAdminAdsList();
  });

  function renderAdminAdsList() {
    const adminAdList = document.getElementById("admin-ad-list");
    if (!adminAdList) return;
    adminAdList.textContent = "";
    if (!latestAds.length) {
      const p = document.createElement("p");
      p.textContent = t("admin.noAds");
      adminAdList.appendChild(p);
      return;
    }

    latestAds
      .slice()
      .sort((a, b) => (a.slot || "").localeCompare(b.slot || ""))
      .forEach((ad) => {
        const item = document.createElement("article");
        item.className = "answer admin-ad-item";

        const content = document.createElement("div");
        const title = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = ad.title || "Publicite";
        title.appendChild(strong);

        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${SLOT_LABELS[ad.slot] || ad.slot} - ${ad.label || "Publicite"}`;

        const period = document.createElement("div");
        period.className = "meta";
        period.textContent = `Periode: ${formatDate(ad.startsAt || ad.createdAt)} -> ${formatDate(ad.endsAt)}`;

        const copy = document.createElement("p");
        copy.textContent = ad.copy || "";

        content.appendChild(title);
        content.appendChild(meta);
        content.appendChild(period);
        content.appendChild(copy);

        if (ad.asset) {
          const info = document.createElement("div");
          info.className = "meta";
          info.textContent = `Media: ${ad.asset.name || "fichier"} ${formatSize(ad.asset.size)}`;
          content.appendChild(info);
        }

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "danger-btn";
        removeBtn.textContent = "Supprimer";
        removeBtn.addEventListener("click", () => {
          socket.emit("ad:delete", { adId: ad.id });
        });

        item.appendChild(content);
        item.appendChild(removeBtn);
        adminAdList.appendChild(item);
      });
  }

  function renderAnswers(question, container, withCommentForm = true) {
    container.textContent = "";
    const answers = (question?.answers || []).filter((answer) => normalizeLang(answer?.lang) === currentLang);
    if (!answers.length) {
      const p = document.createElement("p");
      p.textContent = t("ui.noAnswers");
      container.appendChild(p);
      return;
    }

    const sortedAnswers = answers.slice().sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const visibleCount = visibleAnswersByQuestion.get(question.id) || ANSWERS_PAGE_SIZE;
    const slicedAnswers = sortedAnswers.slice(0, visibleCount);

    slicedAnswers
      .slice()
      .forEach((answer) => {
        const wrapper = document.createElement("article");
        wrapper.className = "answer";

        const top = document.createElement("div");
        top.className = "answer-head";
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        avatar.textContent = (answer.author || "?").charAt(0).toUpperCase();
        const meta = document.createElement("div");
        meta.className = "meta";
        meta.textContent = `${answer.author} - ${formatDate(answer.createdAt)}`;
        top.appendChild(avatar);
        top.appendChild(meta);

        if (hasAdminRights) {
          const delAnswer = document.createElement("button");
          delAnswer.type = "button";
          delAnswer.className = "danger-btn";
          delAnswer.textContent = t("ui.delete");
          delAnswer.addEventListener("click", () => {
            socket.emit("answer:delete", { questionId: question.id, answerId: answer.id });
          });
          top.appendChild(delAnswer);
        }
        const reportAnswerBtn = document.createElement("button");
        reportAnswerBtn.type = "button";
        reportAnswerBtn.className = "report-btn";
        reportAnswerBtn.textContent = t("ui.report");
        reportAnswerBtn.addEventListener("click", () => {
          const payload = askReportPayload("reponse");
          if (!payload) return;
          socket.emit("report:add", {
            questionId: question.id,
            answerId: answer.id,
            reason: payload.reason,
            details: payload.details,
            author: pseudo,
          });
          alert(t("ui.reportSent"));
        });
        top.appendChild(reportAnswerBtn);

        const text = document.createElement("p");
        text.textContent = answer.text;

        const list = document.createElement("div");
        list.className = "comment-list";
        (answer.comments || []).filter((comment) => normalizeLang(comment?.lang) === currentLang).forEach((comment) => {
          const item = document.createElement("div");
          item.className = "comment-item";
          const authorStrong = document.createElement("strong");
          authorStrong.textContent = comment.author;
          const commentText = document.createTextNode(`: ${comment.text} `);
          const metaComment = document.createElement("span");
          metaComment.className = "meta";
          metaComment.textContent = `(${formatDate(comment.createdAt)})`;
          item.appendChild(authorStrong);
          item.appendChild(commentText);
          item.appendChild(metaComment);
          if (hasAdminRights) {
            const delComment = document.createElement("button");
            delComment.type = "button";
            delComment.className = "danger-btn";
            delComment.textContent = t("ui.delete");
            delComment.addEventListener("click", () => {
              socket.emit("comment:delete", {
                questionId: question.id,
                answerId: answer.id,
                commentId: comment.id,
              });
            });
            item.appendChild(delComment);
          }
          const reportCommentBtn = document.createElement("button");
          reportCommentBtn.type = "button";
          reportCommentBtn.className = "report-btn";
          reportCommentBtn.textContent = t("ui.report");
          reportCommentBtn.addEventListener("click", () => {
            const payload = askReportPayload("commentaire");
            if (!payload) return;
            socket.emit("report:add", {
              questionId: question.id,
              answerId: answer.id,
              commentId: comment.id,
              reason: payload.reason,
              details: payload.details,
              author: pseudo,
            });
            alert(t("ui.reportSent"));
          });
          item.appendChild(reportCommentBtn);
          list.appendChild(item);
        });

        wrapper.appendChild(top);
        wrapper.appendChild(text);
        wrapper.appendChild(list);

        if (withCommentForm) {
          const form = document.createElement("form");
          form.className = "stack comment-form";

          const label = document.createElement("label");
          label.textContent = t("ui.commentAnswer");
          const input = document.createElement("input");
          input.maxLength = 500;
          input.required = true;
          input.placeholder = t("ui.commentPlaceholder");
          const btn = document.createElement("button");
          btn.type = "submit";
          btn.textContent = t("ui.commentBtn");

          form.appendChild(label);
          form.appendChild(input);
          form.appendChild(createEmojiBar(input));
          form.appendChild(btn);
          setupTypingEmitter(input, () => ({
            questionId: question.id,
            answerId: answer.id,
            author: pseudo,
            target: "comment",
          }));

          form.addEventListener("submit", (e) => {
            e.preventDefault();
            const comment = input.value.trim();
            if (!comment) return;
            socket.emit("comment:add", {
              questionId: question.id,
              answerId: answer.id,
              text: comment,
              author: pseudo,
              lang: currentLang,
            });
            input.value = "";
          });
          wrapper.appendChild(form);
        }

        container.appendChild(wrapper);
      });

    if (sortedAnswers.length > visibleCount) {
      const moreWrap = document.createElement("div");
      moreWrap.className = "more-wrap";
      const moreBtn = document.createElement("button");
      moreBtn.type = "button";
      moreBtn.textContent = t("ui.loadMore", { count: sortedAnswers.length - visibleCount });
      moreBtn.addEventListener("click", () => {
        visibleAnswersByQuestion.set(question.id, visibleCount + ANSWERS_PAGE_SIZE);
        renderAnswers(question, container, withCommentForm);
      });
      moreWrap.appendChild(moreBtn);
      container.appendChild(moreWrap);
    }
  }

  function bindCommunityWarning(answerForm) {
    if (!answerForm || answerForm.dataset.warningBound === "1") return;
    answerForm.dataset.warningBound = "1";
    const seenKey = "qday_warning_seen_v1";

    const triggerWrap = document.createElement("div");
    triggerWrap.className = "warning-entry";
    const triggerBtn = document.createElement("button");
    triggerBtn.type = "button";
    triggerBtn.className = "warning-open-btn";
    triggerBtn.setAttribute("data-i18n", "warn.open");
    triggerBtn.textContent = t("warn.open");
    triggerWrap.appendChild(triggerBtn);
    answerForm.appendChild(triggerWrap);

    const modal = document.createElement("div");
    modal.className = "warning-modal";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="warning-backdrop" data-warning-close="1"></div>
      <section class="warning-card" role="dialog" aria-modal="true" aria-label="${t("warn.title")}">
        <h3 data-i18n="warn.title">${t("warn.title")}</h3>
        <p data-i18n="warn.intro">${t("warn.intro")}</p>
        <p><strong data-i18n="warn.zero">${t("warn.zero")}</strong></p>
        <ul>
          <li data-i18n="warn.item1">${t("warn.item1")}</li>
          <li data-i18n="warn.item2">${t("warn.item2")}</li>
          <li data-i18n="warn.item3">${t("warn.item3")}</li>
          <li data-i18n="warn.item4">${t("warn.item4")}</li>
        </ul>
        <p><strong data-i18n="warn.consequences">${t("warn.consequences")}</strong></p>
        <p data-i18n="warn.ban">${t("warn.ban")}</p>
        <p class="meta" data-i18n="warn.note">${t("warn.note")}</p>
        <div class="warning-actions">
          <button type="button" class="ghost" data-warning-close="1" data-i18n="warn.close">${t("warn.close")}</button>
          <button type="button" data-warning-ok="1" data-i18n="warn.ok">${t("warn.ok")}</button>
        </div>
      </section>
    `;
    document.body.appendChild(modal);

    const close = () => {
      modal.hidden = true;
      localStorage.setItem(seenKey, "1");
    };
    const open = () => {
      modal.hidden = false;
    };

    triggerBtn.addEventListener("click", open);
    modal.querySelectorAll("[data-warning-close='1']").forEach((el) => {
      el.addEventListener("click", close);
    });
    const okBtn = modal.querySelector("[data-warning-ok='1']");
    okBtn?.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    if (!localStorage.getItem(seenKey)) {
      setTimeout(() => {
        if (document.visibilityState === "visible") open();
      }, 650);
    }
  }

  if (page === "/index.html" || page === "/") {
    const form = document.getElementById("login-form");
    const pseudoInput = document.getElementById("pseudo");
    if (!form || !pseudoInput) return;

    pseudoInput.value = localStorage.getItem("pseudo") || "";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nextPseudo = pseudoInput.value.trim();
      if (!nextPseudo) return;
      if (nextPseudo.toLowerCase() === "admin") {
        alert(t("ui.useAdminPage"));
        return;
      }

      try {
        await fetch("/api/admin/logout", { method: "POST" });
      } catch {}

      localStorage.setItem("pseudo", nextPseudo);
      window.location.href = "/live.html";
    });
    return;
  }

  if (page === "/admin.html") {
    const form = document.getElementById("admin-login-form");
    const passwordInput = document.getElementById("admin-password");
    if (!form || !passwordInput) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const pwd = passwordInput.value;
      if (!pwd) return;

      const resp = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pseudo: "admin", password: pwd }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: t("ui.adminLoginDenied") }));
        alert(err.error || t("ui.adminLoginDenied"));
        return;
      }

      localStorage.setItem("pseudo", "admin");
      window.location.href = "/admin-questions.html";
    });
    return;
  }

  if (page === "/admin-moderation.html") {
    const reportsList = document.getElementById("reports-list");
    const searchInput = document.getElementById("report-search");
    const statusSelect = document.getElementById("report-filter-status");
    const typeSelect = document.getElementById("report-filter-type");
    const authorSelect = document.getElementById("report-filter-author");
    const sortSelect = document.getElementById("report-sort");
    const refreshBtn = document.getElementById("refresh-reports");
    if (!reportsList) return;

    const populateAuthorFilter = () => {
      if (!authorSelect) return;
      const current = moderationState.author;
      const authors = Array.from(new Set(reportsCache.map((r) => String(r.author || "").trim()).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b, "fr")
      );
      authorSelect.textContent = "";
      const all = document.createElement("option");
      all.value = "all";
      all.textContent = t("mod.author.all");
      authorSelect.appendChild(all);
      authors.forEach((author) => {
        const opt = document.createElement("option");
        opt.value = author;
        opt.textContent = author;
        authorSelect.appendChild(opt);
      });
      authorSelect.value = authors.includes(current) ? current : "all";
      moderationState.author = authorSelect.value;
    };

    const filteredReports = () => {
      let list = reportsCache.slice();
      if (moderationState.status !== "all") {
        list = list.filter((r) => (r.status || "open") === moderationState.status);
      }
      if (moderationState.type !== "all") {
        list = list.filter((r) => reportType(r) === moderationState.type);
      }
      if (moderationState.author !== "all") {
        list = list.filter((r) => String(r.author || "") === moderationState.author);
      }
      if (moderationState.search) {
        const q = moderationState.search.toLowerCase();
        list = list.filter((r) =>
          [r.reason, r.details, r.author, r.context?.questionText, r.context?.answerText, r.context?.commentText]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      list.sort((a, b) => {
        if (moderationState.sort === "date_asc") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        if (moderationState.sort === "author_asc") {
          return String(a.author || "").localeCompare(String(b.author || ""), "fr");
        }
        if (moderationState.sort === "type_asc") {
          return reportType(a).localeCompare(reportType(b), "fr");
        }
        if (moderationState.sort === "status_asc") {
          return String(a.status || "").localeCompare(String(b.status || ""), "fr");
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      return list;
    };

    const renderReports = () => {
      reportsList.textContent = "";
      const filtered = filteredReports();
      if (!filtered.length) {
        const p = document.createElement("p");
        p.textContent = t("ui.noReports");
        reportsList.appendChild(p);
        return;
      }
      filtered.forEach((r) => {
        const card = document.createElement("article");
        card.className = "answer";

        const head = document.createElement("div");
        head.className = "answer-head";
        const title = document.createElement("strong");
        title.textContent = `[${(r.status || "open").toUpperCase()}][${reportType(r).toUpperCase()}] ${r.reason}`;
        const meta = document.createElement("span");
        meta.className = "meta";
        meta.textContent = `${r.author} - ${formatDate(r.createdAt)}`;
        head.appendChild(title);
        head.appendChild(meta);
        card.appendChild(head);

        const details = document.createElement("p");
        details.textContent = r.details || t("ui.noDetails");
        card.appendChild(details);

        const context = document.createElement("div");
        context.className = "meta";
        context.textContent = `Q: ${r.context?.questionText || "-"} | R: ${r.context?.answerText || "-"} | C: ${
          r.context?.commentText || "-"
        }`;
        card.appendChild(context);

        const actions = document.createElement("div");
        actions.className = "emoji-bar";
        const resolve = document.createElement("button");
        resolve.type = "button";
        resolve.textContent = t("ui.resolve");
        resolve.addEventListener("click", () => socket.emit("report:status", { reportId: r.id, status: "resolved" }));
        const dismiss = document.createElement("button");
        dismiss.type = "button";
        dismiss.textContent = t("ui.dismiss");
        dismiss.addEventListener("click", () => socket.emit("report:status", { reportId: r.id, status: "dismissed" }));
        const del = document.createElement("button");
        del.type = "button";
        del.className = "danger-btn";
        del.textContent = t("ui.deleteContent");
        del.disabled = !r.context?.targetExists;
        del.addEventListener("click", () => socket.emit("report:take_action", { reportId: r.id, action: "delete_content" }));
        actions.appendChild(resolve);
        actions.appendChild(dismiss);
        actions.appendChild(del);
        card.appendChild(actions);

        reportsList.appendChild(card);
      });
    };

    const loadReports = () => {
      socket.emit("report:list");
    };

    fetch("/api/admin/status")
      .then((r) => r.json())
      .then((s) => {
        hasAdminRights = Boolean(s?.isAdmin);
        updateAdminLinksVisibility();
        if (!hasAdminRights) {
          alert(t("ui.adminRequired"));
          window.location.href = "/admin.html";
          return;
        }
        loadReports();
      })
      .catch(() => {
        window.location.href = "/admin.html";
      });

    socket.on("report:list", (reports) => {
      reportsCache = Array.isArray(reports) ? reports : [];
      populateAuthorFilter();
      renderReports();
    });
    socket.on("report:changed", loadReports);
    socket.on("report:created", loadReports);

    searchInput?.addEventListener("input", () => {
      moderationState.search = searchInput.value.trim();
      renderReports();
    });
    statusSelect?.addEventListener("change", () => {
      moderationState.status = statusSelect.value || "all";
      renderReports();
    });
    typeSelect?.addEventListener("change", () => {
      moderationState.type = typeSelect.value || "all";
      renderReports();
    });
    authorSelect?.addEventListener("change", () => {
      moderationState.author = authorSelect.value || "all";
      renderReports();
    });
    sortSelect?.addEventListener("change", () => {
      moderationState.sort = sortSelect.value || "date_desc";
      renderReports();
    });
    refreshBtn?.addEventListener("click", loadReports);
    return;
  }

  if (page === "/live.html") {
    const questionEl = document.getElementById("current-question");
    const questionMediaEl = document.getElementById("current-question-media");
    const shareBtn = document.getElementById("share-current-question");
    const answersList = document.getElementById("answers-list");
    const answerForm = document.getElementById("answer-form");
    const answerText = document.getElementById("answer-text");
    bindCommunityWarning(answerForm);
    let currentQuestion = null;

    const adminPanel = document.getElementById("admin-panel");
    if (isAdminPseudo && adminPanel) {
      fetch("/api/admin/status")
        .then((r) => r.json())
        .then((s) => {
          if (!s?.isAdmin) {
            adminPanel.hidden = true;
            updateAdminLinksVisibility();
            return;
          }
          hasAdminRights = true;
          updateAdminLinksVisibility();
          adminPanel.hidden = false;
          bindAdminPanel();
          if (currentQuestion) renderAnswers(currentQuestion, answersList, true);
        })
        .catch(() => {});
    }

    function bindAdminPanel() {
      const questionForm = document.getElementById("question-form");
      const questionText = document.getElementById("question-text");
      const adForm = document.getElementById("ad-form");
      const adSlot = document.getElementById("ad-slot");
      const adLabel = document.getElementById("ad-label");
      const adTitle = document.getElementById("ad-title");
      const adCopy = document.getElementById("ad-copy");
      const adStartAt = document.getElementById("ad-start-at");
      const adEndAt = document.getElementById("ad-end-at");
      const adAsset = document.getElementById("ad-asset");
      const adCurrentAsset = document.getElementById("ad-current-asset");

      questionForm?.addEventListener("submit", (e) => {
        e.preventDefault();
        const text = (questionText?.value || "").trim();
        if (!text) return;
        socket.emit("question:add", { text });
        questionText.value = "";
      });

      function fillAdFormFromSlot() {
        const slot = adSlot.value;
        const existing = latestAds.find((ad) => ad.slot === slot);
        if (!existing) {
          adLabel.value = "Publicite";
          adTitle.value = "";
          adCopy.value = "";
          adStartAt.value = toInputDateTimeValue(new Date().toISOString());
          adEndAt.value = "";
          adCurrentAsset.textContent = t("ui.emptyAdSlot");
          adAsset.value = "";
          return;
        }
        adLabel.value = existing.label || "Publicite";
        adTitle.value = existing.title || "";
        adCopy.value = existing.copy || "";
        adStartAt.value = toInputDateTimeValue(existing.startsAt || existing.createdAt);
        adEndAt.value = toInputDateTimeValue(existing.endsAt);
        adCurrentAsset.textContent = existing.asset
          ? `Media actuel: ${existing.asset.name || "fichier"} ${formatSize(existing.asset.size)}`
          : t("ui.emptyAdSlot");
        adAsset.value = "";
      }

      adSlot?.addEventListener("change", fillAdFormFromSlot);
      fillAdFormFromSlot();

      adForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
          slot: adSlot.value,
          label: adLabel.value.trim() || "Publicite",
          title: adTitle.value.trim(),
          copy: adCopy.value.trim(),
          startsAt: fromInputDateTimeValue(adStartAt.value),
          endsAt: fromInputDateTimeValue(adEndAt.value),
        };
        if (!payload.title || !payload.copy || !payload.startsAt || !payload.endsAt) return;
        if (new Date(payload.endsAt).getTime() <= new Date(payload.startsAt).getTime()) {
          alert(t("ui.saveDateError"));
          return;
        }

        const selectedFile = adAsset.files && adAsset.files[0] ? adAsset.files[0] : null;
        if (selectedFile) {
          const formData = new FormData();
          formData.append("asset", selectedFile);
          const response = await fetch("/api/admin/upload-ad-asset", { method: "POST", body: formData });
          if (!response.ok) {
            const err = await response.json().catch(() => ({ error: "Erreur upload media." }));
            alert(err.error || "Erreur upload media.");
            return;
          }
          payload.asset = await response.json();
        } else {
          const existing = latestAds.find((ad) => ad.slot === payload.slot);
          payload.asset = existing?.asset || null;
        }
        socket.emit("ad:add", payload);
      });
    }

    answerForm?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isAdminPseudo) {
        alert("L'administrateur ne peut pas repondre aux questions.");
        return;
      }
      if (!currentQuestion) return;
      const text = answerText.value.trim();
      if (!text) return;
      socket.emit("answer:add", { questionId: currentQuestion.id, text, author: pseudo, lang: currentLang });
      answerText.value = "";
    });

    if (answerText) {
      const emojiBar = createEmojiBar(answerText);
      answerText.insertAdjacentElement("afterend", emojiBar);
      setupTypingEmitter(answerText, () => ({
        questionId: currentQuestion?.id || "",
        author: pseudo,
        target: "answer",
      }));
      const typingEl = document.createElement("div");
      typingEl.id = "typing-indicator-live";
      typingEl.className = "meta typing-indicator";
      emojiBar.insertAdjacentElement("afterend", typingEl);
      if (isAdminPseudo) {
        answerText.disabled = true;
        const submitBtn = answerForm?.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;
      }
    }

    socket.on("current:updated", (question) => {
      currentQuestion = question;
      currentLiveQuestionId = question?.id || null;
      if (!question) {
        questionEl.textContent = t("ui.noActiveQuestion");
        renderQuestionMedia(null, questionMediaEl);
        if (shareBtn) shareBtn.hidden = true;
        answersList.textContent = "";
        renderTypingIndicators();
        return;
      }
      if (!visibleAnswersByQuestion.has(question.id)) {
        visibleAnswersByQuestion.set(question.id, ANSWERS_PAGE_SIZE);
      }
      renderQuestionMedia(question, questionMediaEl);
      questionEl.textContent = textForLang(question);
      if (shareBtn) {
        shareBtn.hidden = false;
        shareBtn.onclick = () => {
          shareQuestion(currentQuestion, "live").catch(() => {});
        };
      }
      renderAnswers(question, answersList, true);
      renderTypingIndicators();
    });

    socket.on("question:updated", (question) => {
      if (!currentQuestion || question.id !== currentQuestion.id) return;
      currentQuestion = question;
      renderAnswers(question, answersList, true);
      renderTypingIndicators();
    });

    window.addEventListener("qday:lang-changed", () => {
      if (!currentQuestion) {
        questionEl.textContent = t("ui.noActiveQuestion");
        renderQuestionMedia(null, questionMediaEl);
        answersList.textContent = "";
        return;
      }
      renderQuestionMedia(currentQuestion, questionMediaEl);
      questionEl.textContent = textForLang(currentQuestion);
      renderAnswers(currentQuestion, answersList, true);
    });
  }

  if (page === "/history.html") {
    const historyList = document.getElementById("history-list");
    const selectedTitle = document.getElementById("selected-title");
    const selectedQuestion = document.getElementById("selected-question");
    const selectedQuestionMedia = document.getElementById("selected-question-media");
    const shareBtn = document.getElementById("share-selected-question");
    const answersList = document.getElementById("answers-list");
    const answerForm = document.getElementById("answer-form");
    const answerText = document.getElementById("answer-text");
    bindCommunityWarning(answerForm);
    let selectedId = null;
    let historyItemsCache = [];
    let selectedQuestionCache = null;

    if (isAdminPseudo) {
      fetch("/api/admin/status")
        .then((r) => r.json())
        .then((s) => {
          hasAdminRights = Boolean(s?.isAdmin);
          updateAdminLinksVisibility();
          if (hasAdminRights && selectedId) socket.emit("question:get", selectedId);
        })
        .catch(() => {});
    }

    function renderHistory(items) {
      historyList.textContent = "";
      if (!items.length) {
        const p = document.createElement("p");
        p.textContent = t("ui.noQuestion");
        historyList.appendChild(p);
        return;
      }
      items.forEach((item) => {
        const btn = document.createElement("button");
        btn.className = `history-item ${selectedId === item.id ? "active" : ""}`;

        const strong = document.createElement("strong");
        strong.textContent = textForLang(item);
        const br = document.createElement("br");
        const meta = document.createElement("span");
        meta.className = "meta";
        meta.textContent = `${formatDate(item.createdAt)} - ${t("history.answersCount", { count: item.answersCount })}`;
        btn.appendChild(strong);
        btn.appendChild(br);
        btn.appendChild(meta);

        btn.addEventListener("click", () => {
          selectedId = item.id;
          socket.emit("question:get", item.id);
          renderHistory(items);
        });
        historyList.appendChild(btn);
      });
    }

    socket.on("history:list", (items) => {
      historyItemsCache = Array.isArray(items) ? items : [];
      const hashId = decodeURIComponent((window.location.hash || "").replace(/^#q=/, "").trim());
      if (hashId && historyItemsCache.some((item) => item.id === hashId)) {
        selectedId = hashId;
      }
      renderHistory(items);
      if (!selectedId && items.length) {
        selectedId = items[0].id;
        socket.emit("question:get", selectedId);
      } else if (selectedId) {
        socket.emit("question:get", selectedId);
      }
    });

    answerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (isAdminPseudo) {
        alert("L'administrateur ne peut pas repondre aux questions.");
        return;
      }
      if (!selectedId) return;
      const text = answerText.value.trim();
      if (!text) return;
      socket.emit("answer:add", { questionId: selectedId, text, author: pseudo, lang: currentLang });
      answerText.value = "";
    });

    if (answerText) {
      const emojiBar = createEmojiBar(answerText);
      answerText.insertAdjacentElement("afterend", emojiBar);
      setupTypingEmitter(answerText, () => ({
        questionId: selectedId || "",
        author: pseudo,
        target: "answer",
      }));
      const typingEl = document.createElement("div");
      typingEl.id = "typing-indicator-history";
      typingEl.className = "meta typing-indicator";
      emojiBar.insertAdjacentElement("afterend", typingEl);
      if (isAdminPseudo) {
        answerText.disabled = true;
        const submitBtn = answerForm?.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = true;
      }
    }

    socket.on("question:updated", (question) => {
      if (question.id !== selectedId) return;
      selectedQuestionCache = question;
      currentHistoryQuestionId = question.id;
      window.location.hash = `q=${encodeURIComponent(question.id)}`;
      selectedTitle.textContent = question.active ? t("ui.statusCurrent") : t("ui.statusArchived");
      renderQuestionMedia(question, selectedQuestionMedia);
      selectedQuestion.textContent = textForLang(question);
      if (shareBtn) {
        shareBtn.hidden = false;
        shareBtn.onclick = () => {
          shareQuestion(selectedQuestionCache, "history").catch(() => {});
        };
      }
      answerForm.hidden = false;
      if (!visibleAnswersByQuestion.has(question.id)) {
        visibleAnswersByQuestion.set(question.id, ANSWERS_PAGE_SIZE);
      }
      renderAnswers(question, answersList, true);
      renderTypingIndicators();
    });

    window.addEventListener("qday:lang-changed", () => {
      renderHistory(historyItemsCache);
      if (!selectedQuestionCache) return;
      renderQuestionMedia(selectedQuestionCache, selectedQuestionMedia);
      selectedQuestion.textContent = textForLang(selectedQuestionCache);
      renderAnswers(selectedQuestionCache, answersList, true);
    });
  }
})();
