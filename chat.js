var CURRENT_ZIPCODE = JSON.parse('false');
var CURRENT_SITE_URL = '';
var CURRENT_NICKNAME = '';
var PT_MARKETPLACE = 'anon'.trim();
var PT_WITH_ANONYMOUS = 'true' == 'true' ? true : false;

loadVars();

var pointertopNS = {

  PT_ROUTING_SERVICE: '',

  getUrlParameter: function(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  },

  lang: null,
  i18n: function(key) {
    var translation = {
      es: {
        _: 0
        , 'CHAT_TITLE': "Chat"
        , 'CONTACT_TITLE': "Contáctanos"
        , 'SUBMIT_BTN': "Enviar"
        , 'CONTACT_BTN': "Enviar solicitud"
        , 'JHON_DOE': "anonymous"
        , 'NAME_HINT': "Escribe tu nombre"
        , 'ZIPCODE_HINT': "Escribe tu zipcode"
        , 'MSG_HINT': "Escribe tu mensaje"
        , 'STARTED_HINT': 'A la espera de un agente de ventas...'
        , 'TURN_HINT': "Su turno actual es {0}"
        , 'TYPING_HINT': "{0} está escribiendo..."
        , 'AGENT_CONN': "{0} está ahora disponible."
        , 'DISCONN_MSG': "La conexión con el agente se ha perdido. Por favor espera que se te asigne un nuevo agente. Te contactaremos en breve."
        , 'CUSTFRM_TITLE': "Información Básica"
        , 'CUSTFRM_NAME': "Nombres"
        , 'CUSTFRM_SURNAME': "Apellidos"
        , 'CUSTFRM_PHONE': "Teléfono"
        , 'ENDED_SESS_MSG': "El agente ha terminado la sesión."
        , "INVALID_ZIPCODE": "El código postal debe ser un número"
        , "PLATFORM_URL_INVALID": "Url de plataforma invalida, por favor comuniquese con el administrador"
      },
      en: {
        _: 0
        , 'CHAT_TITLE': "Chat"
        , 'CONTACT_TITLE': "Contact us"
        , 'SUBMIT_BTN': "Send"
        , 'CONTACT_BTN': "Send request"
        , 'JHON_DOE': "anonymous"
        , 'NAME_HINT': "Write your name"
        , 'ZIPCODE_HINT': "Write your zipcode"
        , 'MSG_HINT': "Write your message"
        , 'STARTED_HINT': 'Waiting for a sales agent...'
        , 'TURN_HINT': "Your turn is {0}"
        , 'TYPING_HINT': "{0} is writing..."
        , 'AGENT_CONN': "{0} is available now."
        , 'DISCONN_MSG': "The connection with Sales Rep is lost. Please wait as we assign a new SR for you. We'll contact you shortly."
        , 'CUSTFRM_TITLE': "Basic Information"
        , 'CUSTFRM_NAME': "Firstname"
        , 'CUSTFRM_SURNAME': "Lastname"
        , 'CUSTFRM_PHONE': "Phone number"
        , 'ENDED_SESS_MSG': "The agent has finished the session"
        , "INVALID_ZIPCODE": "The zip code must be a number"
        , "PLATFORM_URL_INVALID": "Platform URL invalid, please contact the administrator"
      }
    }
    var lang = pointertopNS.lang
    return translation[lang] && translation[lang][key]
  },

  verifyCaptcha: function(response) {
    pointertopNS.loginFrm.set('captcha', response)
  },

  format: function(str) {
    var args = arguments
    return str.replace(/\{(\d)\}/gi, function(f, i) { return args[Number(i) + 1] })
  },

  debounce: function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = Date.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = Date.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    }
  },

  throttle: function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : Date.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = Date.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  }
}

var onloadCaptcha = function() {
  if (!window.telexa_captchakey) {
    alert('telexa_captchakey is required for telexa_chat')
    return
  }
  pointertopNS.captchaId = grecaptcha.render('g-captcha', {
    'sitekey': window.telexa_captchakey,
    'theme': 'light',
    'callback': pointertopNS.verifyCaptcha
  })
}

var mobileCheck = function() {
  var check = false;
  (function(a) {
    if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)))
      check = true;
  })(window.navigator.userAgent || window.navigator.vendor || window.opera);
  return check;
};

var sess = {
  _sess: null,
  attr: function(field, value) {
    if (this._sess == null)
      this._sess = JSON.parse(sessionStorage.getItem('currentSession')) || {};
    if (value !== undefined) {
      this._sess[field] = value;
      sessionStorage.setItem('currentSession', JSON.stringify(this._sess));
      console.info("sess:sess", this._sess)
    }
    return this._sess[field];
  },

  clear: function(roamKey) {
    if (!roamKey) return
    var roamSocketId = '/#' + roamKey
    // ignore if roamKey already in session
    var roaimgUids = sess.attr('roamingUids') || []
    if (roaimgUids.indexOf(roamSocketId) >= 0) return;
    console.log("Roaming with:", roamKey)
    this._sess = null;
    sessionStorage.removeItem('currentSession');
    var roaimgUids = [roamSocketId]
    sess.attr('agent', {});
    sess.attr('roamingUids', roaimgUids);
    // NOTE after roaming from clientView to home don't show basic information embedded form anymore
    sess.attr('CustInfoForm', { seq: -1, hidden: true });
  },

  connected: function(socket) {
    var roaimgUids = sess.attr('roamingUids') || []
    roaimgUids.indexOf(socket.id) < 0 && roaimgUids.push('/#' + socket.id);
    sess.attr('roamingUids', roaimgUids)
  },

  roaming: function(socket, callback) {
    var storedSess = sessionStorage.getItem('currentSession')
    var curSess = this._sess = JSON.parse(storedSess);
    if (curSess && curSess.roamingUids) {
      var roamJoin = {
        nickname: curSess.nickname,
        roam: {
          uid: curSess.roamingUids,
          agentUID: curSess.agent.uid,
          embeddedData: {
            curPage: document.location.href,
            titlePage: document.getElementsByTagName('title')[0].text
          }
        },
        categ: sess.attr('categ'),
        mobile: mobileCheck()
      }
      socket.emit('join', roamJoin, function(resp) {
        console.log('JOIN roaming', curSess.agent, roamJoin, resp);
        if (resp.waiting < 0) {
          sessionStorage.removeItem('currentSession')
          callback(null)
        }
        else {
          var agnt = sess.attr('agent') || {}
          var roamData = (resp.roaming && (resp.roaming.length && resp.roaming[0])) || {}
          resp.agentUID && (agnt.uid = resp.agentUID);
          roamData.agentName && (agnt.name = roamData.agentName);
          sess.attr('agent', agnt)
          roamData.nickname && sess.attr('nickname', roamData.nickname)
          resp.chatLog && sess.attr('chatHistory', resp.chatLog);
          callback(resp)
        }
      })
    }
    else {
      setTimeout(function() {
        sessionStorage.removeItem('currentSession')
        callback(null);
      })
    }
  },

  drop: function() {
    sessionStorage.removeItem('currentSession');
  }
}

function onReady() {
  pointertopNS.lang = navigator.language || 'es'
  pointertopNS.lang = pointertopNS.lang.replace(/-\w+$/, "").trim()

  console.info('== Telexa chat noCaptcha')
  var PATT_TITLE = '<span class="glyphicon glyphicon-comment"></span>&nbsp;{0}'
  var PATT_MSG = '<div class="row msg-container"><div class="col-md-12 col-xs-12">' +
    '<div class="chat-msg chat-msg-{0}"><p>{1}</p><strong class="chat-msg-author">{2}</strong></div></div></div>'
  var PATT_TYP = '<span class="glyphicon glyphicon-pencil"></span>&nbsp;{0}'

  var format = pointertopNS.format
  var chat = pointertopNS.chat = $(".telexa_chat")
  var i18n = pointertopNS.i18n
  var custInf

  chat.find(".chat-title").html(format(PATT_TITLE, i18n('CHAT_TITLE')))
  chat.find(".chat-submit-button").attr('value', i18n('SUBMIT_BTN'))

  var currentUrlPtReset = /.+\?([^&]*)&?ptreset/.exec(document.location.href);
  if (currentUrlPtReset) {
    droppedZipcode();
    sessionStorage.removeItem('currentSession');
    window.history.pushState("", $('title').text(), '/?' + currentUrlPtReset[1]);
  } else {
    var roamKey = pointertopNS.getUrlParameter('roamKey');
    if (roamKey) {
      if (!sessionStorage.hasOwnProperty('siteUrl')) {
        var ref = /(.+)\/clientView.*/.exec(document.referrer);
        if (ref) {
          var domain = ref[1];
          sessionStorage.setItem('siteUrl', domain);
        }
      }
    }
  }

  var socket = {
    emit: function() { },
    on: function() { },
    off: function() { }
  }
  if (CURRENT_SITE_URL && CURRENT_SITE_URL != '/') {
    try {
      socket = io(CURRENT_SITE_URL);
      socket.on('connect', function() {
        console.log("Connected to '/main'")
        var roamKey = pointertopNS.getUrlParameter('roamKey');
        if (roamKey) {
          // clear history and
          sess.clear(roamKey);
          // disallow back button to prevent session disconnection
          console.log("BACK DISABLED")
          history.pushState(null, null, document.URL);
          window.addEventListener('popstate', function() {
            history.pushState(null, null, document.URL);
          });
        }
        socket.emit('peek', function(ret) {
          console.log("Peek :", ret)
          if (!ret.serving) {
            contactFrm = new ContactForm(socket)
          }
          else {
            if (CURRENT_NICKNAME == 'false') {
              if (pointertopNS.loginFrm) {
                pointertopNS.loginFrm.destroy()
              }
              pointertopNS.chatFrm = new ChatForm('anonymous')
              pointertopNS.loginFrm = null
            }
            else {
              sess.roaming(socket, function(joinResp) {
                if (!joinResp) return
                console.log('sess.roaming knownClient');
                pointertopNS.chatFrm = new ChatForm(sess.attr('nickname'), joinResp);
              })
            }
          }
        })
      });
    } catch (error) {
      console.log('socket error', error);
    }

  } else {
    console.info('socket no connect', socket);
  }
  if (mobileCheck()) {
    $('.minim_ctrl').addClass('hide');
    $('.telexa_chat').addClass('transform-active')
    $('.telexa_chat').css({ bottom: (-$('.body-chat').height()) + 'px' });
    $(".chat-top-bar").click(function() {
      if ($('.telexa_chat').toggleClass('transform-active').hasClass('transform-active'))
        $('.telexa_chat').css({ bottom: (-$('.body-chat').height()) + 'px' });
      else
        $('.telexa_chat').css({ bottom: '0px' });
    });
  }
  function ContactForm() {
    chat.find(".chat-title").html(format(PATT_TITLE, i18n('CONTACT_TITLE')))
    chat.find(".contact-submit-button")
      .attr('value', i18n('CONTACT_BTN'))
    chat.find(".chat-form").addClass('hide')
    chat.find(".contact-form").removeClass('hide')

    var frm = chat.find("form");
    function contactNow(ev) {
      ev.preventDefault()
      frm.off('submit', contactNow)
      chat.find(".contact-form").addClass('hide')
      pointertopNS.chatFrm = new ChatForm(i18n('JHON_DOE'))
    }
    frm.submit(contactNow)
  }

  function LoginForm() {
    var chatFrm = chat.find('.chat-form');
    chatFrm.find(".form-control-group input").val('');
    chatFrm.find(".icon_minim, .chat-body").addClass('hide')
    chatFrm.find(".chat-submit-button").addClass('disabled')
    chatFrm.find(".form-group").addClass('has-error')
    chatFrm.find("#g-captcha").addClass('hide')

    var self = this
    var captcha = chat.find("#g-captcha")
    var onChange = function(ev) {
      self.set('nickname', $(this).val())
    };
    var onChangeZipCode = function(ev) { self.setZipcode('zipcode', $(this).val()) };
    var revealCaptcha = function(ev) { captcha.removeClass('hide') }
    chatFrm.find(".chat-input").on('keypress', onChange).attr('placeholder', i18n('NAME_HINT'));
    //chatFrm.find(".chat-input").on('input', onChange).attr('placeholder', i18n('NAME_HINT'))
    chatFrm.find(".chat-input-zipcode").on('input', onChangeZipCode).attr('placeholder', i18n('ZIPCODE_HINT'))
    if ('' == 'true')
      chatFrm.click(revealCaptcha)

    this.set = function(field, value) {
      this[field] = value
      var chkCaptcha = '' == 'true' ? this.captcha : true;
      chatFrm.find(".form-group")[this.nickname ? 'removeClass' : 'addClass']('has-error')
      if ($(".form-control-group-zipcode").hasClass("hide") || $(".form-control-group-zipcode").length == 0) {
        chatFrm.find(".chat-submit-button")[chkCaptcha && this.nickname ? 'removeClass' : 'addClass']('disabled')
      }
    }
    this.setZipcode = function(field, value) {
      if ($.isNumeric(value)) {
        this[field] = Math.abs(value);
      }
      var chkCaptcha = '' == 'true' ? this.captcha : true;
      chatFrm.find(".form-control-group-zipcode")[value && $.isNumeric(value) ? 'removeClass' : 'addClass']('has-error')
      chatFrm.find(".chat-submit-button")[chkCaptcha && value && $.isNumeric(value) ? 'removeClass' : 'addClass']('disabled')
    }
    this.valid = function() {
      var chkCaptcha = '' == 'true' ? this.captcha : true;
      if ($(".form-control-group-zipcode").hasClass("hide") || $(".form-control-group-zipcode").length == 0) {
        return chkCaptcha && this.nickname;
      } else {
        return chkCaptcha && this.zipcode && $.isNumeric(this.zipcode);
      }
    }
    this.destroy = function() {
      chatFrm.find(".chat-input").off('input', onChange).off('click', revealCaptcha)
    }
    return this
  }

  // == Customer info form, it asks for name & phoneNumber
  // ========================
  function CustInfoForm(socket, prm) {
    var frm = chat.find('.custInfo')
    var i18n = pointertopNS.i18n
    var custData = {
      valid: function(fld) {
        if (fld) {
          return fld == 'phoneNumber' ? custData.phoneNumber && custData.phoneNumber.match(/^(()?\d{3}())?(-|\s)?\d{3}(-|\s)?\d{4}$/) : custData[fld]
        }
        return custData.firstName && custData.lastName && custData.phoneNumber && custData.phoneNumber.match(/^(()?\d{3}())?(-|\s)?\d{3}(-|\s)?\d{4}$/)
      }
    }
    var chkValid = function(ev) {
      fld = $(this)
      custData[fld.attr("id")] = fld.val()
      console.log('chkValid', fld.attr("id"), fld.val(), custData.valid(fld.attr("id")))
      fld.closest(".form-group")[custData.valid(fld.attr("id")) ? 'removeClass' : 'addClass']('has-error')
      frm.find(".custinf-submit")[custData.valid() ? 'removeClass' : 'addClass']('disabled')
    }

    var frmSeq
    this.show = function(frmSeqPrm) {
      sess.attr('CustInfoForm', { seq: frmSeqPrm })
      frm.removeClass('hide')
      frmSeq = frmSeqPrm
    }

    this.hide = function(frmSeqPrm) {
      frm.addClass('hide')
    }

    frm.find('.panel-title').text(i18n('CUSTFRM_TITLE'))
    frm.find("[for='firstName']").text(i18n('CUSTFRM_NAME'))
    frm.find("#firstName").focus().change(chkValid).keyup(chkValid)
    if (prm.nickname != "anonymous")
      frm.find("#firstName").val(prm.nickname)
    custData.firstName = prm.nickname;
    custData.nickname = prm.nickname;
    frm.find("[for='lastName']").text(i18n('CUSTFRM_SURNAME'))
    frm.find("#lastName").change(chkValid).keyup(chkValid)
    frm.find("[for='phoneNumber']").text(i18n('CUSTFRM_PHONE'))
    frm.find("#phoneNumber").change(chkValid).keyup(chkValid)

    frm.find(".custinf-submit").attr('value', i18n('SUBMIT_BTN')).addClass('disabled')

    frm.find("form").submit(function(ev) {
      ev.preventDefault()
      if (!sess.attr('agent').uid || !custData.valid()) {
        return
      }
      prm.firstName = custData.firstName
      prm.phoneNumber = custData.phoneNumber
      sess.attr('nickname', prm.firstName);
      pointertopNS.chatFrm && (pointertopNS.chatFrm.nickname = prm.firstName)

      frm.find("#firstName").val("")
      frm.find("#lastName").val("")
      frm.find("#phoneNumber").val("")
      frm.addClass('hide')
      custData.embedded = true
      sess.attr('CustInfoForm', { seq: frmSeq, hidden: true });
      socket.emit('chat', { uid: sess.attr('agent').uid, event: 'updateClientInfo', payload: Object.assign({}, custData) })
      socket.emit('chat', { uid: sess.attr('agent').uid, event: 'onFormSubmit', payload: frmSeq })
      custData = Object.assign({}, { valid: custData.valid })
    })
    return this
  }

  // == Chat form, implements the chat
  // ========================
  function ChatForm(nickname, joinRespPrm) {
    var self = this
    var chatHist = sess.attr('chatHistory');
    if (chatHist == null)
      chatHist = sess.attr('chatHistory', []);
    sess.attr('nickname', nickname);
    var deterSystemMsgs = sess.attr('deterSystemMsgs');
    if (deterSystemMsgs === undefined)
      sess.attr('deterSystemMsgs', CURRENT_NICKNAME == 'false');
    this.nickname = nickname
    systemSender = {
      name: 'System'
    }
    var curAgent = sess.attr('agent');
    if (!curAgent || !curAgent.uid)
      sess.attr('agent', systemSender);
    $.ajax({
      url: CURRENT_SITE_URL + "/config",
      dataType: 'json',
      success: function(config) {
        systemSender.name = config.companyName || 'System'
        var fnInactivity = function() {
          socket.emit('chat', { uid: sess.attr('agent').uid, event: 'userActivity', payload: {} })
        };
        var fnActivityCallback = pointertopNS.throttle(fnInactivity, config.usrInactivityTimeout / 2);
        $("body").on("mousemove keypress click", fnActivityCallback);
      },
      error: function(data) {
        alert(i18n('PLATFORM_URL_INVALID'));
      }
    });

    chat.find(".chat-form").removeClass('hide')
    chat.find(".chat-submit-button").attr('value', i18n('SUBMIT_BTN'))
    if (!PT_WITH_ANONYMOUS) {
      chat.find(".chat-input").attr('placeholder', i18n('NAME_HINT')).val('').focus()
    } else {
      chat.find(".chat-input").attr('placeholder', i18n('MSG_HINT')).val('').focus()
    }
    chat.find(".icon_minim").removeClass('hide')
    chat.find(".chat-body").removeClass('hide')
    chat.find("#g-captcha").addClass('hide')

    this.receiveMsg = function(msg, author) {
      if (sess.attr('deterSystemMsgs')) {
        return
      }
      var chatHist = sess.attr('chatHistory');
      chatHist.push({ 'username': sess.attr('agent').name, 'content': msg });
      sess.attr('chatHistory', chatHist);
      var msgContainerBase = chat.find(".msg-container-base")
      $(format(PATT_MSG, 'receive', msg, sess.attr('agent').name)).appendTo(msgContainerBase)
      msgContainerBase[0] && msgContainerBase.scrollTop(msgContainerBase[0].scrollHeight);
      chat.find(".chat-input").val('').focus()
    }

    if (chatHist.length == 0)
      this.receiveMsg(i18n('STARTED_HINT'))

    this.postMsg = function(msg) {
      if (sess.attr('deterSystemMsgs')) {
        console.log("postMsg")
        sess.attr('deterSystemMsgs', false)
        self.receiveMsg(i18n('STARTED_HINT'))
      }
      if (sess.attr('agent').uid) {
        socket.emit('chat', { uid: sess.attr('agent').uid, event: 'chat message', payload: msg })
      }
      var chatHist = sess.attr('chatHistory');
      chatHist.push({ 'username': this.nickname, 'content': msg })
      sess.attr('chatHistory', chatHist);
      var msgContainerBase = chat.find(".msg-container-base")
      $(format(PATT_MSG, 'sent', msg, this.nickname)).appendTo(msgContainerBase)
      msgContainerBase[0] && msgContainerBase.scrollTop(msgContainerBase[0].scrollHeight);
      chat.find(".chat-input").val('').focus()
    }

    var hideHint = pointertopNS.debounce(function() {
      chat.find('.chat-status').addClass('hidden');
      if ($('.telexa_chat').hasClass('transform-active')) {
        $('.telexa_chat').css({ bottom: (-$('.body-chat').height()) + 'px' });
      }
    }, 2500)

    this.showHint = function(msg, keep) {
      chat.find('.chat-status').html(msg).removeClass('hidden')
      if (!keep)
        hideHint()
    }

    this.destroy = function() {
      chat.find(".msg-container").remove()
      chat.find(".icon_minim").addClass('hide')
      chat.find(".chat-body").addClass('hide')
      socket.off('dropped')
        .off('turn')
        .off('enter')
        .off('chat message')
        .off('sellerTyping')
        .off('postForm')
    }

    var updTurn = function(resp) {
      if (!sess.attr('deterSystemMsgs'))
        self.showHint(format(i18n('TURN_HINT'), resp))
    }

    var initJoin = function(resp) {
      console.log("initJoin", resp)
      if (resp.serving > 0) {
        sess.connected(socket);
        $(".chat-input").attr('placeholder', pointertopNS.i18n('MSG_HINT')).val('').focus();
        if (!sess.attr('deterSystemMsgs'))
          resp.waiting && self.showHint(format(i18n('TURN_HINT'), resp.waiting))
      }
      else {
        var agent = "&agent=" + encodeURIComponent(sess.attr('agent').name)
        var username = self.nickname ? "&username=" + encodeURIComponent(self.firstName || self.nickname) : ""
        var phone = self.phoneNumber ? "&phone=" + encodeURIComponent(self.phoneNumber) : ""
        var categ = window.telexa_categ ? "&categ=" + encodeURIComponent(window.telexa_categ) : ""
        socket.emit('drop', { agentUID: sess.attr('agent').uid, chatLog: sess.attr('chatHistory'), roaming: {} })
        setTimeout(function() {
          window.location.href = CURRENT_SITE_URL + "/clientView/#/roaming?rkey=" + encodeURIComponent(socket.id) + agent + username + phone + categ
          socket.disconnect()
        }, 400)
      }
    }
    var usr = { nickname: this.nickname }
    usr.embedded = true
    if (window.telexa_categ)
      usr.categ = window.telexa_categ
    usr.embeddedData = {
      curPage: document.location.href,
      titlePage: document.getElementsByTagName('title')[0].text
    };

    this.restore = function(joinResp) {
      var nickname = sess.attr('nickname');
      var chatHist = sess.attr('chatHistory');
      if (chatHist && chatHist.length) {
        var msgContainerBase = chat.find(".msg-container-base");
        $(msgContainerBase).empty();
        chatHist.forEach(function(chatMsg) {
          $(format(PATT_MSG,
            chatMsg.username == nickname ? 'sent' : 'receive',
            chatMsg.content, chatMsg.username)).appendTo(msgContainerBase);
        });
        msgContainerBase[0] && msgContainerBase.scrollTop(msgContainerBase[0].scrollHeight);
      }
      var form = sess.attr('CustInfoForm');
      if (form) {
        custInf = new CustInfoForm(socket, self)
        if (!form.hidden)
          custInf.show(form.seq)
      }
      initJoin(joinResp)
    }

    if (!joinRespPrm) {
      sess.roaming(socket, function(joinResp) {
        if (!joinResp) {
          console.log('JOIN after roaming');
          socket.emit('join', usr, initJoin)
        }
        else
          self.restore(joinResp)
      })
    }
    else
      self.restore(joinRespPrm);

    socket.on('enter', function(agent) {
      !sess.attr('deterSystemMsgs') && self.receiveMsg(format(i18n('AGENT_CONN'), agent.name))
      sess.attr('deterSystemMsgs', false);
      console.log("enter", agent);
      sess.attr('agent', agent);
      socket.emit('chat', { uid: sess.attr('agent').uid, event: 'langChoice', payload: pointertopNS.lang })
    })

    socket.on('turn', updTurn)

    socket.on('dropped', function(drop) {
      if (drop.uid == sess.attr('agent').uid) {
        sess.attr('agent', systemSender);
        if (drop.intended) {
          self.receiveMsg(i18n('ENDED_SESS_MSG'))
          custInf && custInf.hide()
          setTimeout(function() {
            pointertopNS.chatFrm.destroy()
            delete pointertopNS.chatFrm
            pointertopNS.loginFrm = new LoginForm()
            droppedZipcode();
            sess.drop();
            if (!window.telexa_captchakey) {
              pointertopNS.loginFrm.set('captcha', 'OK')
            }
            else {
              console.log("reset:", pointertopNS.captchaId)
              grecaptcha.reset(pointertopNS.captchaId)
            }
          }, 4000)
        }
        else {
          self.receiveMsg(i18n('DISCONN_MSG'))
          var usr = { nickname: self.nickname }
          if (window.telexa_categ)
            usr.categ = window.telexa_categ
          usr.embeddedData = {
            curPage: document.location.href,
            titlePage: document.getElementsByTagName('title')[0].text
          };
          console.log('JOIN dropped');
          socket.emit('join', usr, initJoin)
        }
      }
    })

    socket.on('chat message', function(msg) {
      self.receiveMsg(msg, sess.attr('agent').name)
    })

    socket.on('sellerTyping', function(msg) {
      self.showHint(format(PATT_TYP, format(i18n('TYPING_HINT'), sess.attr('agent').name)))
    });

    var sendTyping = pointertopNS.debounce(function() {
      sess.attr('agent').uid && socket.emit('chat',
        { uid: sess.attr('agent').uid, event: 'clientTyping', payload: { msgLength: 1 } })
    }, 2500, true)
    chat.find(".chat-input").keypress(sendTyping)

    socket.on('postForm', function(frm) {
      if (!custInf && frm.trigger == 'pushEntryPage' && frm.prm == 'entry_page') {
        custInf = new CustInfoForm(socket, self)
        custInf.show(frm.seq)
      }
      else {
        var agent = "&agent=" + encodeURIComponent(sess.attr('agent').name)
        var username = self.nickname ? "&username=" + encodeURIComponent(self.firstName || self.nickname) : ""
        var phone = self.phoneNumber ? "&phone=" + encodeURIComponent(self.phoneNumber) : ""
        var categ = window.telexa_categ ? "&categ=" + encodeURIComponent(window.telexa_categ) : ""

        socket.emit('drop', { agentUID: sess.attr('agent').uid, chatLog: sess.attr('chatHistory'), roaming: { 'event': 'postForm', 'payload': frm } })
        setTimeout(function() {
          window.location.href = CURRENT_SITE_URL + "/clientView/#/roaming?rkey=" + encodeURIComponent(socket.id) + agent + username + phone + categ
          //droppedZipcode();
          socket.disconnect()
        }, 400)
      }
    });

    return this
  }

  pointertopNS.loginFrm = new LoginForm()

  if (!window.telexa_captchakey) {
    pointertopNS.loginFrm.set('captcha', 'OK');
  }

  chat.find(".glyphicon-minus").click(function() {
    chat.find(".chat-body").toggleClass('hide');
    chat.find(".icon_minim").toggleClass('glyphicon-minus glyphicon-plus');
  })

  chat.find(".chat-form").unbind("submit");
  chat.find(".chat-form").on('submit', function(ev) {
    ev.preventDefault()
    if (pointertopNS.loginFrm && !pointertopNS.loginFrm.valid())
      return
    if (CURRENT_SITE_URL != '/' && CURRENT_SITE_URL) {
      if (!pointertopNS.chatFrm) {
        pointertopNS.loginFrm.destroy()
        pointertopNS.chatFrm = new ChatForm(pointertopNS.loginFrm.nickname)
        pointertopNS.loginFrm = null
      }
      else {
        chat.find(".chat-input").attr('placeholder', i18n('MSG_HINT')).focus()
        pointertopNS.chatFrm.postMsg(chat.find(".chat-input").val())
        $(".chat-submit-button")[chat.find(".chat-input").val() ? 'removeClass' : 'addClass']('disabled');
      }
    } else {
      if ($.isNumeric(pointertopNS.loginFrm.zipcode)) {
        $.ajax({
          url: pointertopNS.PT_ROUTING_SERVICE + 'connectByZipcode?marketplace=' + PT_MARKETPLACE + '&zipcode=' + pointertopNS.loginFrm.zipcode,
          type: 'GET',
          success: function(response) {
            checkUrlPlatform(response.data.url, function(err, config) {
              if (err) {
                console.log('Error Url platform', err);
                alert(i18n('PLATFORM_URL_INVALID'));
                return;
              }
              sessionStorage.setItem('zipcode', pointertopNS.loginFrm.zipcode);
              sessionStorage.setItem('siteUrl', response.data.url);
              chat.find(".chat-input").attr('placeholder', i18n('NAME_HINT')).val('').focus()
              sess.drop();
              loadVars(onReady);
            })
          },
          error: function(error) {
            console.log('error', error)
            alert(error.responseText);
          }
        });
      } else {
        alert(i18n('INVALID_ZIPCODE'));
      }
    }
  });

  toogleInputChat();
}

function checkUrlPlatform(siteUrl, callback) {
  $.ajax({
    url: siteUrl + "/config",
    dataType: 'json',
    success: function(config) {
      callback(null, config);
    },
    error: function(err) {
      callback(err);
    }
  });
}

function loadVars(cb) {
  CURRENT_ZIPCODE = sessionStorage.hasOwnProperty('zipcode') ? sessionStorage.getItem('zipcode') : '45632';
  CURRENT_SITE_URL = sessionStorage.hasOwnProperty('siteUrl') ? sessionStorage.getItem('siteUrl') : 'https://pointertop.meridiangroupsa.com:8443';
  CURRENT_NICKNAME = sessionStorage.hasOwnProperty('nickname') ? sessionStorage.getItem('nickname') : 'false';
  if (cb) cb();
}

function toogleInputChat() {
  loadVars();
  if (CURRENT_SITE_URL && !PT_WITH_ANONYMOUS) {
    $('.form-control-group-zipcode').addClass('hide');
    $('.form-control-txt').removeClass('hide');
  } else {
    if (!CURRENT_SITE_URL) {
      $('.form-control-group-zipcode').removeClass('hide');
      $('.form-control-txt').addClass('hide');
    } else {
      $('.form-control-group-zipcode').addClass('hide');
      $('.form-control-txt').removeClass('hide');
      //$(".chat-input").attr('placeholder', pointertopNS.i18n('MSG_HINT')).val('').focus()
    }
  }
}

function droppedZipcode() {
  sessionStorage.removeItem('zipcode');
  sessionStorage.removeItem('siteUrl');
  sessionStorage.removeItem('nickname');
  loadVars();
  toogleInputChat();
}

$(document).on('ready', function() {
  setTimeout(onReady, 600);
});