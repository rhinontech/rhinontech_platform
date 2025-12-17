const generateMarketingEmail = () => {
    return `<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
 <meta charset="UTF-8" />
 <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
 <!--[if !mso]><!-- -->
 <meta http-equiv="X-UA-Compatible" content="IE=edge" />
 <!--<![endif]-->
 <meta name="viewport" content="width=device-width, initial-scale=1.0" />
 <meta name="format-detection" content="telephone=no" />
 <meta name="format-detection" content="date=no" />
 <meta name="format-detection" content="address=no" />
 <meta name="format-detection" content="email=no" />
 <meta name="x-apple-disable-message-reformatting" />
 <link href="https://fonts.googleapis.com/css?family=Work+Sans:ital,wght@0,400;0,400;0,500;0,600;0,700" rel="stylesheet" />
 <link href="https://fonts.googleapis.com/css?family=Inter:ital,wght@0,400;0,400" rel="stylesheet" />
 <title>Untitled</title>
 <!-- Made with Postcards Email Builder by Designmodo -->
 <style>
 html,
         body {
             margin: 0 !important;
             padding: 0 !important;
             min-height: 100% !important;
             width: 100% !important;
             -webkit-font-smoothing: antialiased;
         }
 
         * {
             -ms-text-size-adjust: 100%;
         }
 
         #outlook a {
             padding: 0;
         }
 
         .ReadMsgBody,
         .ExternalClass {
             width: 100%;
         }
 
         .ExternalClass,
         .ExternalClass p,
         .ExternalClass td,
         .ExternalClass div,
         .ExternalClass span,
         .ExternalClass font {
             line-height: 100%;
         }
 
         table,
         td,
         th {
             mso-table-lspace: 0 !important;
             mso-table-rspace: 0 !important;
             border-collapse: collapse;
         }
 
         u + .body table, u + .body td, u + .body th {
             will-change: transform;
         }
 
         body, td, th, p, div, li, a, span {
             -webkit-text-size-adjust: 100%;
             -ms-text-size-adjust: 100%;
             mso-line-height-rule: exactly;
         }
 
         img {
             border: 0;
             outline: 0;
             line-height: 100%;
             text-decoration: none;
             -ms-interpolation-mode: bicubic;
         }
 
         a[x-apple-data-detectors] {
             color: inherit !important;
             text-decoration: none !important;
         }
                 
         .body .pc-project-body {
             background-color: transparent !important;
         }
 
         @media (min-width: 621px) {
             .pc-lg-hide {
                 display: none;
             } 
 
             .pc-lg-bg-img-hide {
                 background-image: none !important;
             }
         }
 </style>
 <style>
 @media (max-width: 620px) {
 .pc-project-body {min-width: 0px !important;}
 .pc-project-container {width: 100% !important;}
 .pc-sm-hide, .pc-w620-gridCollapsed-1 > tbody > tr > .pc-sm-hide {display: none !important;}
 .pc-sm-bg-img-hide {background-image: none !important;}
 .pc-w620-itemsSpacings-20-20 {padding-left: 10px !important;padding-right: 10px !important;padding-top: 10px !important;padding-bottom: 10px !important;}
 table.pc-w620-spacing-12-0-24-0 {margin: 12px 0px 24px 0px !important;}
 td.pc-w620-spacing-12-0-24-0,th.pc-w620-spacing-12-0-24-0{margin: 0 !important;padding: 12px 0px 24px 0px !important;}
 .pc-w620-padding-0-0-0-0 {padding: 0px 0px 0px 0px !important;}
 .pc-w620-width-107 {width: 107px !important;}
 .pc-w620-height-auto {height: auto !important;}
 .pc-w620-itemsSpacings-16-0 {padding-left: 8px !important;padding-right: 8px !important;padding-top: 0px !important;padding-bottom: 0px !important;}
 div.pc-w620-align-left,th.pc-w620-align-left,a.pc-w620-align-left,td.pc-w620-align-left {text-align: left !important;text-align-last: left !important;}
 table.pc-w620-align-left{float: none !important;margin-right: auto !important;margin-left: 0 !important;}
 img.pc-w620-align-left{margin-right: auto !important;margin-left: 0 !important;}
 .pc-w620-valign-middle {vertical-align: middle !important;}
 td.pc-w620-halign-left,th.pc-w620-halign-left {text-align: left !important;}
 table.pc-w620-halign-left {float: none !important;margin-right: auto !important;margin-left: 0 !important;}
 img.pc-w620-halign-left {margin-right: auto !important;margin-left: 0 !important;}
 .pc-w620-valign-top {vertical-align: top !important;}
 .pc-w620-fontSize-14px {font-size: 14px !important;}
 div.pc-w620-textAlign-left,th.pc-w620-textAlign-left,a.pc-w620-textAlign-left,td.pc-w620-textAlign-left {text-align: left !important;text-align-last: left !important;}
 table.pc-w620-textAlign-left{float: none !important;margin-right: auto !important;margin-left: 0 !important;}
 img.pc-w620-textAlign-left{margin-right: auto !important;margin-left: 0 !important;}
 td.pc-w620-halign-center,th.pc-w620-halign-center {text-align: center !important;}
 table.pc-w620-halign-center {float: none !important;margin-right: auto !important;margin-left: auto !important;}
 img.pc-w620-halign-center {margin-right: auto !important;margin-left: auto !important;}
 .pc-w620-radius-30-30-30-30 {border-radius: 30px 30px 30px 30px !important;}
 .pc-w620-padding-0-6-0-6 {padding: 0px 6px 0px 6px !important;}
 div.pc-w620-align-center,th.pc-w620-align-center,a.pc-w620-align-center,td.pc-w620-align-center {text-align: center !important;text-align-last: center !important;}
 table.pc-w620-align-center {float: none !important;margin-right: auto !important;margin-left: auto !important;}
 img.pc-w620-align-center {margin-right: auto !important;margin-left: auto !important;}
 .pc-w620-text-align-center {text-align: center !important;text-align-last: center !important;}
 .pc-w620-font-size-14px {font-size: 14px !important;}
 .pc-w620-font-style-normal {font-style: normal !important;}
 .pc-w620-font-weight-600 {font-weight: 600 !important;}
 .pc-w620-color-1e3a8a {color: #1e3a8a !important;}
 .pc-w620-padding-20-32-0-32 {padding: 20px 32px 0px 32px !important;}
 table.pc-w620-spacing-0-0-0-0 {margin: 0px 0px 0px 0px !important;}
 td.pc-w620-spacing-0-0-0-0,th.pc-w620-spacing-0-0-0-0{margin: 0 !important;padding: 0px 0px 0px 0px !important;}
 table.pc-w620-spacing-0-32-16-32 {margin: 0px 32px 16px 32px !important;}
 td.pc-w620-spacing-0-32-16-32,th.pc-w620-spacing-0-32-16-32{margin: 0 !important;padding: 0px 32px 16px 32px !important;}
 .pc-w620-font-size-40px {font-size: 40px !important;}
 .pc-w620-line-height-40px {line-height: 40px !important;}
 table.pc-w620-spacing-0-32-24-32 {margin: 0px 32px 24px 32px !important;}
 td.pc-w620-spacing-0-32-24-32,th.pc-w620-spacing-0-32-24-32{margin: 0 !important;padding: 0px 32px 24px 32px !important;}
 table.pc-w620-spacing-0-0-40-32 {margin: 0px 0px 40px 32px !important;}
 td.pc-w620-spacing-0-0-40-32,th.pc-w620-spacing-0-0-40-32{margin: 0 !important;padding: 0px 0px 40px 32px !important;}
 .pc-w620-padding-12-20-12-20 {padding: 12px 20px 12px 20px !important;}
 .pc-w620-padding-32-0-0-0 {padding: 32px 0px 0px 0px !important;}
 .pc-w620-itemsSpacings-8-30 {padding-left: 4px !important;padding-right: 4px !important;padding-top: 15px !important;padding-bottom: 15px !important;}
 
 .pc-w620-width-fill {width: 100% !important;}
 .pc-w620-padding-32-32-32-32 {padding: 32px 32px 32px 32px !important;}
 .pc-w620-width-65 {width: 65px !important;}
 table.pc-w620-spacing-0-0-32-0 {margin: 0px 0px 32px 0px !important;}
 td.pc-w620-spacing-0-0-32-0,th.pc-w620-spacing-0-0-32-0{margin: 0 !important;padding: 0px 0px 32px 0px !important;}
 .pc-w620-padding-0-10-0-0 {padding: 0px 10px 0px 0px !important;}
 .pc-w620-font-size-32px {font-size: 32px !important;}
 .pc-w620-itemsSpacings-0-16 {padding-left: 0px !important;padding-right: 0px !important;padding-top: 8px !important;padding-bottom: 8px !important;}
 table.pc-w620-spacing-0-0-24-0 {margin: 0px 0px 24px 0px !important;}
 td.pc-w620-spacing-0-0-24-0,th.pc-w620-spacing-0-0-24-0{margin: 0 !important;padding: 0px 0px 24px 0px !important;}
 .pc-w620-itemsSpacings-0-30 {padding-left: 0px !important;padding-right: 0px !important;padding-top: 15px !important;padding-bottom: 15px !important;}
 .pc-w620-itemsSpacings-20-0 {padding-left: 10px !important;padding-right: 10px !important;padding-top: 0px !important;padding-bottom: 0px !important;}
 table.pc-w620-spacing-0-0-20-0 {margin: 0px 0px 20px 0px !important;}
 td.pc-w620-spacing-0-0-20-0,th.pc-w620-spacing-0-0-20-0{margin: 0 !important;padding: 0px 0px 20px 0px !important;}
 .pc-w620-padding-0-16-0-16 {padding: 0px 16px 0px 16px !important;}
 .pc-w620-line-height-120pc {line-height: 120% !important;}
 
 .pc-w620-gridCollapsed-1 > tbody,.pc-w620-gridCollapsed-1 > tbody > tr,.pc-w620-gridCollapsed-1 > tr {display: inline-block !important;}
 .pc-w620-gridCollapsed-1.pc-width-fill > tbody,.pc-w620-gridCollapsed-1.pc-width-fill > tbody > tr,.pc-w620-gridCollapsed-1.pc-width-fill > tr {width: 100% !important;}
 .pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody > tr,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tr {width: 100% !important;}
 .pc-w620-gridCollapsed-1 > tbody > tr > td,.pc-w620-gridCollapsed-1 > tr > td {display: block !important;width: auto !important;padding-left: 0 !important;padding-right: 0 !important;margin-left: 0 !important;}
 .pc-w620-gridCollapsed-1.pc-width-fill > tbody > tr > td,.pc-w620-gridCollapsed-1.pc-width-fill > tr > td {width: 100% !important;}
 .pc-w620-gridCollapsed-1.pc-w620-width-fill > tbody > tr > td,.pc-w620-gridCollapsed-1.pc-w620-width-fill > tr > td {width: 100% !important;}
 .pc-w620-gridCollapsed-1 > tbody > .pc-grid-tr-first > .pc-grid-td-first,pc-w620-gridCollapsed-1 > .pc-grid-tr-first > .pc-grid-td-first {padding-top: 0 !important;}
 .pc-w620-gridCollapsed-1 > tbody > .pc-grid-tr-last > .pc-grid-td-last,pc-w620-gridCollapsed-1 > .pc-grid-tr-last > .pc-grid-td-last {padding-bottom: 0 !important;}
 
 .pc-w620-gridCollapsed-0 > tbody > .pc-grid-tr-first > td,.pc-w620-gridCollapsed-0 > .pc-grid-tr-first > td {padding-top: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > .pc-grid-tr-last > td,.pc-w620-gridCollapsed-0 > .pc-grid-tr-last > td {padding-bottom: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > tr > .pc-grid-td-first,.pc-w620-gridCollapsed-0 > tr > .pc-grid-td-first {padding-left: 0 !important;}
 .pc-w620-gridCollapsed-0 > tbody > tr > .pc-grid-td-last,.pc-w620-gridCollapsed-0 > tr > .pc-grid-td-last {padding-right: 0 !important;}
 
 .pc-w620-tableCollapsed-1 > tbody,.pc-w620-tableCollapsed-1 > tbody > tr,.pc-w620-tableCollapsed-1 > tr {display: block !important;}
 .pc-w620-tableCollapsed-1.pc-width-fill > tbody,.pc-w620-tableCollapsed-1.pc-width-fill > tbody > tr,.pc-w620-tableCollapsed-1.pc-width-fill > tr {width: 100% !important;}
 .pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody > tr,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tr {width: 100% !important;}
 .pc-w620-tableCollapsed-1 > tbody > tr > td,.pc-w620-tableCollapsed-1 > tr > td {display: block !important;width: auto !important;}
 .pc-w620-tableCollapsed-1.pc-width-fill > tbody > tr > td,.pc-w620-tableCollapsed-1.pc-width-fill > tr > td {width: 100% !important;box-sizing: border-box !important;}
 .pc-w620-tableCollapsed-1.pc-w620-width-fill > tbody > tr > td,.pc-w620-tableCollapsed-1.pc-w620-width-fill > tr > td {width: 100% !important;box-sizing: border-box !important;}
 }
 </style>
 <!--[if !mso]><!-- -->
 <style>
 @font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 400; src: url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBiEJoA.woff') format('woff'), url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K0nXBiEJpg.woff2') format('woff2'); } @font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 700; src: url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K67QBiEJoA.woff') format('woff'), url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K67QBiEJpg.woff2') format('woff2'); } @font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 600; src: url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K5fQBiEJoA.woff') format('woff'), url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K5fQBiEJpg.woff2') format('woff2'); } @font-face { font-family: 'Work Sans'; font-style: normal; font-weight: 500; src: url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K3vXBiEJoA.woff') format('woff'), url('https://fonts.gstatic.com/s/worksans/v19/QGY_z_wNahGAdqQ43RhVcIgYT2Xz5u32K3vXBiEJpg.woff2') format('woff2'); } @font-face { font-family: 'Inter'; font-style: normal; font-weight: 400; src: url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZFhjg.woff') format('woff'), url('https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZFhiA.woff2') format('woff2'); }
 </style>
 <!--<![endif]-->
 <!--[if mso]>
    <style type="text/css">
        .pc-font-alt {
            font-family: Arial, Helvetica, sans-serif !important;
        }
    </style>
    <![endif]-->
 <!--[if gte mso 9]>
    <xml>
        <o:OfficeDocumentSettings>
            <o:AllowPNG/>
            <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
    </xml>
    <![endif]-->
</head>

<body class="body pc-font-alt" style="width: 100% !important; min-height: 100% !important; margin: 0 !important; padding: 0 !important; line-height: 1.5; color: #2D3A41; mso-line-height-rule: exactly; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; font-variant-ligatures: normal; text-rendering: optimizeLegibility; -moz-osx-font-smoothing: grayscale; background-color: #f4f4f4;" bgcolor="#f4f4f4">
 <table class="pc-project-body" style="table-layout: fixed; min-width: 600px; background-color: #f4f4f4;" bgcolor="#f4f4f4" width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
  <tr>
   <td align="center" valign="top">
    <table class="pc-project-container" align="center" width="600" style="width: 600px; max-width: 600px;" border="0" cellpadding="0" cellspacing="0" role="presentation">
     <tr>
      <td style="padding: 20px 0px 20px 0px;" align="left" valign="top">
       <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="width: 100%;">
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Menu -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-20-32-0-32" style="padding: 20px 40px 24px 40px; height: unset; background-color: #1e3a8a;" bgcolor="#1e3a8a">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-12-0-24-0" style="padding: 12px 0px 24px 0px;">
                   <table class="pc-width-fill pc-w620-gridCollapsed-0" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-w620-itemsSpacings-20-20" align="left" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="middle">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td align="left" valign="top">
                               <img src="https://cloudfilesdm.com/postcards/image-1736835666846.png" class="pc-w620-width-107 pc-w620-height-auto" width="160" height="54" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 160px; height: auto; max-width: 100%; border: 0;" />
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-grid-td-last pc-w620-itemsSpacings-20-20" align="left" valign="middle" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="right" valign="bottom">
                         <table align="right" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="right" valign="top">
                            <table align="right" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td class="pc-w620-valign-middle pc-w620-align-left" align="left">
                               <table class="pc-width-hug pc-w620-gridCollapsed-0 pc-w620-halign-left" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr class="pc-grid-tr-first pc-grid-tr-last">
                                 <td class="pc-grid-td-first pc-w620-itemsSpacings-16-0" valign="top" style="padding-top: 0px; padding-right: 10px; padding-bottom: 0px; padding-left: 0px;">
                                  <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-halign-left pc-w620-valign-top" align="center" valign="middle">
                                     <table class="pc-w620-halign-left" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                                      <tr>
                                       <td class="pc-w620-halign-left" align="center" valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="pc-w620-halign-left" align="center" style="border-collapse: separate; border-spacing: 0;">
                                         <tr>
                                          <td valign="top" class="pc-w620-textAlign-left" align="center">
                                           <a class="pc-font-alt pc-w620-textAlign-left pc-w620-fontSize-14px" href="https://rhinontech.com/plans" target="_blank" style="display: block; text-decoration: none; line-height: 120%; letter-spacing: -0px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; font-weight: 500; font-variant-ligatures: normal; color: #ffffff; text-align: center; text-align-last: center;">
                                            <span>Pricing</span> 
                                           </a>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                 <td class="pc-grid-td-last pc-w620-itemsSpacings-16-0" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 10px;">
                                  <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                   <tr>
                                    <td class="pc-w620-radius-30-30-30-30 pc-w620-padding-0-6-0-6 pc-w620-halign-center pc-w620-valign-middle" align="center" valign="middle" style="padding: 0px 6px 0px 6px; background-color: #ffffff; border-radius: 18px 18px 18px 18px; border-top: 1px solid #417CD6; border-right: 1px solid #417CD6; border-bottom: 1px solid #417CD6; border-left: 1px solid #417CD6;">
                                     <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                                      <tr>
                                       <td class="pc-w620-halign-center" align="center" valign="top">
                                        <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="pc-w620-halign-center" align="center" style="border-collapse: separate; border-spacing: 0;">
                                         <tr>
                                          <td valign="top" class="pc-w620-align-center" align="center">
                                           <a class="pc-font-alt pc-w620-align-center" href="https://drive.google.com/file/d/1evZ7wuv7eSSpYpwyMWGFJ-EsniJDzc7U/view?usp=sharing" target="_blank" style="text-decoration: none;">
                                            <span style="font-size: 14px;line-height: 120%;text-align:justify;text-align-last:justify;color:#1e3a8a;letter-spacing:0px;font-weight:600;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span class="pc-w620-text-align-center"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 120%; text-decoration: none; text-transform: none;" class="pc-w620-font-size-14px pc-w620-font-style-normal pc-w620-font-weight-600 pc-w620-color-1e3a8a">Demo </span>
                                            </span>
                                            </span>
                                           </a>
                                          </td>
                                         </tr>
                                        </table>
                                       </td>
                                      </tr>
                                     </table>
                                    </td>
                                   </tr>
                                  </table>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                 <tr>
                  <td valign="top">
                   <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                     <!--[if gte mso 9]>
                    <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #ffffff14;">&nbsp;</td>
                <![endif]-->
                     <!--[if !gte mso 9]><!-- -->
                     <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #ffffff14;">&nbsp;</td>
                     <!--<![endif]-->
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Menu -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Start your trial -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-32-0-0-0" style="padding: 10px 0px 0px 0px; height: unset; border-radius: 0px; background-color: #1e3a8a;" bgcolor="#1e3a8a">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-32-16-32" align="left" valign="top" style="padding: 0px 0px 16px 40px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" class="pc-w620-padding-0-0-0-0" align="left" style="padding: 0px 0px 0px 0px;">
                      <div class="pc-font-alt" style="text-decoration: none;">
                       <div style="font-size: 40px;line-height: 40px;text-align:left;text-align-last:left;color:#ffffff;letter-spacing:-1px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 56px; line-height: 110%; text-decoration: none; text-transform: none;" class="pc-w620-font-size-40px pc-w620-line-height-40px">Start your free </span>
                        </div>
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 56px; line-height: 110%; text-decoration: none; text-transform: none;" class="pc-w620-font-size-40px pc-w620-line-height-40px">trial today!</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-32-24-32" align="left" valign="top" style="padding: 0px 40px 32px 40px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" class="pc-w620-padding-0-0-0-0" align="left" style="padding: 0px 0px 0px 0px;">
                      <div class="pc-font-alt" style="text-decoration: none;">
                       <div style="font-size: 15px;line-height: 20px;text-align:left;text-align-last:left;color:#ffffff;font-style:normal;font-weight:700;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">Perfect your customer support experience with RhinonTech.</span>
                         <br><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-weight: 400; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">Enjoy our free trial and discover how we can help you break language barriers, streamline support workflows, and enhance customer satisfaction effortlessly.</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <th valign="top" class="pc-w620-spacing-0-0-40-32" align="left" style="padding: 0px 0px 40px 40px; text-align: left; font-weight: normal; line-height: 1;">
                   <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="border-collapse: separate; border-spacing: 0;">
            <tr>
                <td valign="middle" align="center" style="border-radius: 85px 85px 85px 85px; background-color: #ffffff; text-align:center; color: #ffffff; padding: 10px 24px 10px 24px; mso-padding-left-alt: 0; margin-left:24px;" bgcolor="#ffffff">
                                    <a class="pc-font-alt" style="display: inline-block; text-decoration: none; font-variant-ligatures: normal; font-family: 'Work Sans', Arial, Helvetica, sans-serif; text-align: center;" href="https://app.rhinontech.com/auth/signup" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:-0.2px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">Let’s get trial</span></span></span></a>
                                </td>
            </tr>
        </table>
        <![endif]-->
                   <!--[if !mso]><!-- -->
                   <a class="pc-w620-padding-12-20-12-20" style="display: inline-block; box-sizing: border-box; border-radius: 85px 85px 85px 85px; background-color: #ffffff; padding: 10px 24px 10px 24px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none;" href="https://app.rhinontech.com/auth/signup" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:-0.2px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">Let’s get trial</span></span></span></a>
                   <!--<![endif]-->
                  </th>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center" valign="top" style="padding: 0px 0px 0px 0px;">
                   <img src="https://cloudfilesdm.com/postcards/image-1736835894704.png" width="600" height="auto" alt="Website Image" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 100%; height: auto; border: 0;" />
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Start your trial -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Contacts -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-32-32-32-32" style="padding: 40px 40px 40px 40px; height: unset; background-color: #ffffff;" bgcolor="#ffffff">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center" valign="top" style="padding: 0px 0px 32px 0px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" align="center" style="padding: 0px 0px 0px 0px;">
                      <div class="pc-font-alt" style="text-decoration: none;">
                       <div style="font-size: 28px;line-height: 120%;text-align:center;text-align-last:center;color:#1e3a8a;font-style:normal;font-weight:700;letter-spacing:0px;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 28px; line-height: 120%; text-decoration: none; text-transform: none;">Why RhinonTech?</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table class="pc-w620-width-fill" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center">
                   <table class="pc-width-hug pc-w620-gridCollapsed-0 pc-w620-width-fill" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-grid-td-last pc-w620-itemsSpacings-8-30" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="center" valign="top">
                         <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="center" valign="top">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 16px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" class="pc-w620-align-center" align="center" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                   <div style="font-size: 15px;line-height: 20px;text-align:center;text-align-last:center;color:#2D3A41;font-style:normal;font-weight:400;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">We support and provide your team's customer support needs at any scale. Whether you're a small startup or an enterprise-level company, we’ve got you covered.</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <th valign="top" align="center" style="padding: 0px 0px 16px 0px; text-align: center; font-weight: normal; line-height: 1;">
                               <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" width="306" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
            <tr>
                <td valign="middle" align="center" style="width: 306px; border-top: 1px solid #243361; border-right: 1px solid #243361; border-bottom: 1px solid #243361; border-left: 1px solid #243361; background-color: transparent; text-align:center; color: #ffffff; padding: 12px 20px 12px 20px; mso-padding-left-alt: 0; margin-left:20px;" bgcolor="transparent">
                                    <a class="pc-font-alt" style="display: inline-block; text-decoration: none; font-variant-ligatures: normal; font-family: 'Work Sans', Arial, Helvetica, sans-serif; text-align: center;" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">Call us: +91 824 929 1789</span></span></span></a>
                                </td>
            </tr>
        </table>
        <![endif]-->
                               <!--[if !mso]><!-- -->
                               <a style="display: inline-block; box-sizing: border-box; border-top: 1px solid #243361; border-right: 1px solid #243361; border-bottom: 1px solid #243361; border-left: 1px solid #243361; background-color: transparent; padding: 12px 20px 12px 20px; width: 306px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none; mso-hide: all;" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">Call us: +91 824 929 1789</span></span></span></a>
                               <!--<![endif]-->
                              </th>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <th valign="top" align="center" style="padding: 0px 0px 24px 0px; text-align: center; font-weight: normal; line-height: 1;">
                               <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" width="306" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
            <tr>
                <td valign="middle" align="center" style="width: 306px; border-top: 1px solid #243361; border-right: 1px solid #243361; border-bottom: 1px solid #243361; border-left: 1px solid #243361; background-color: transparent; text-align:center; color: #ffffff; padding: 12px 20px 12px 20px; mso-padding-left-alt: 0; margin-left:20px;" bgcolor="transparent">
                                    <a class="pc-font-alt" style="display: inline-block; text-decoration: none; font-variant-ligatures: normal; font-family: 'Work Sans', Arial, Helvetica, sans-serif; text-align: center;" href="mailto:info@rhinontech.com" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">info@rhinontech.com</span></span></span></a>
                                </td>
            </tr>
        </table>
        <![endif]-->
                               <!--[if !mso]><!-- -->
                               <a style="display: inline-block; box-sizing: border-box; border-top: 1px solid #243361; border-right: 1px solid #243361; border-bottom: 1px solid #243361; border-left: 1px solid #243361; background-color: transparent; padding: 12px 20px 12px 20px; width: 306px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none; mso-hide: all;" href="mailto:info@rhinontech.com" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#1e3a8a;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">info@rhinontech.com</span></span></span></a>
                               <!--<![endif]-->
                              </th>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="center">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 15px;line-height: 20px;text-align:center;text-align-last:center;color:#2D3A41;font-style:normal;font-weight:400;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">Let’s improve the efficiency of your customer service interactions and help you connect with your customers like never before.</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Contacts -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Features -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-32-32-32-32" style="padding: 40px 40px 60px 40px; height: unset; border-radius: 0px; background-color: #1e3a8a;" bgcolor="#1e3a8a">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center" valign="top" style="padding: 0px 0px 40px 0px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" align="center" style="padding: 0px 0px 0px 0px;">
                      <div class="pc-font-alt" style="text-decoration: none;">
                       <div style="font-size: 28px;line-height: 34px;text-align:center;text-align-last:center;color:#ffffff;font-style:normal;font-weight:700;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 28px; line-height: 34px; text-decoration: none; text-transform: none;">Discover a Smarter Way to Deliver Customer Support</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table class="pc-w620-width-fill" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-valign-top pc-w620-halign-center">
                   <table class="pc-width-fill pc-w620-gridCollapsed-1 pc-w620-width-fill pc-w620-halign-center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-w620-itemsSpacings-8-30" align="center" valign="top" style="width: 33.333333333333%; padding-top: 0px; padding-right: 24px; padding-bottom: 0px; padding-left: 0px;">
                      <table class="pc-w620-halign-center" style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="top">
                         <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td class="pc-w620-halign-center" align="center" valign="top" style="padding: 0px 0px 16px 0px;">
                               <img src="https://cloudfilesdm.com/postcards/a4fccd75ae36d7ba45c65519dd093058.png" class="pc-w620-width-65 pc-w620-height-auto pc-w620-align-center" width="80" height="80" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; object-fit: contain; width: 80px; height: auto; max-width: 100%; border: 0;" />
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table class="pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 6px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" class="pc-w620-align-center" align="left">
                                  <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                   <div style="font-size: 16px;line-height: 20px;text-align:center;text-align-last:center;color:#ffffff;font-style:normal;font-weight:500;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">Lead</span>
                                    </div>
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">Generation</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-w620-itemsSpacings-8-30" align="center" valign="top" style="width: 33.333333333333%; padding-top: 0px; padding-right: 24px; padding-bottom: 0px; padding-left: 24px;">
                      <table class="pc-w620-halign-center" style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="top">
                         <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td class="pc-w620-halign-center" align="center" valign="top" style="padding: 0px 0px 16px 0px;">
                               <img src="https://cloudfilesdm.com/postcards/1de53e3a5bc15bc2c35e1a26ad81ecb7.png" class="pc-w620-width-65 pc-w620-height-auto pc-w620-align-center" width="80" height="80" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; object-fit: contain; width: 80px; height: auto; max-width: 100%; border: 0;" />
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table class="pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 6px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" class="pc-w620-align-center" align="left">
                                  <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                                   <div style="font-size: 16px;line-height: 20px;text-align:center;text-align-last:center;color:#ffffff;font-style:normal;font-weight:600;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">Voice-Activated </span>
                                    </div>
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">Conversations</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-grid-td-last pc-w620-itemsSpacings-8-30" align="center" valign="top" style="width: 33.333333333333%; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 24px;">
                      <table class="pc-w620-halign-center" style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td class="pc-w620-halign-center pc-w620-valign-top" align="center" valign="top">
                         <table class="pc-w620-halign-center" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td class="pc-w620-halign-center" align="center" valign="top" style="padding: 0px 0px 16px 0px;">
                               <img src="https://cloudfilesdm.com/postcards/5b6b43d637422d8b484947a191d6fd29.png" class="pc-w620-width-65 pc-w620-height-auto pc-w620-align-center" width="80" height="80" alt="" style="display: block; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; object-fit: contain; width: 80px; height: auto; max-width: 100%; border: 0;" />
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td class="pc-w620-halign-center" align="center" valign="top">
                            <table class="pc-w620-halign-center" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 6px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="center">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 15px;line-height: 20px;text-align:center;text-align-last:center;color:#fefefe;font-style:normal;font-weight:600;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">Intelligent </span>
                                    </div>
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">Dashboard</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Features -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Numbers -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-32-32-32-32" style="padding: 60px 40px 60px 40px; height: unset; border-radius: 0px; background-color: #eff2ff;" bgcolor="#eff2ff">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-0-32-0" align="left" valign="top" style="padding: 0px 0px 40px 0px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="left" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" class="pc-w620-padding-0-10-0-0" align="left" style="padding: 0px 10px 0px 0px;">
                      <div class="pc-font-alt" style="text-decoration: none;">
                       <div style="font-size: 32px;line-height: 120%;color:#1e3a8a;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 33px; line-height: 120%; text-decoration: none; text-transform: none;" class="pc-w620-font-size-32px">Don't miss out – try it free and elevate your team's success!</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-0-24-0" align="left" style="padding: 0px 0px 40px 0px;">
                   <table class="pc-width-hug pc-w620-gridCollapsed-1" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 20px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="border-collapse: separate; border-spacing: 0;">
                             <tr>
                              <td valign="top" align="left">
                               <div class="pc-font-alt" style="text-decoration: none;">
                                <div style="font-size: 60px;line-height: 120%;text-align:left;text-align-last:left;color:#ff6c44;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                 <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 60px; line-height: 120%; text-decoration: none; text-transform: none;">07</span>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-grid-td-last pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 20px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 8px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 20px;line-height: 120%;text-align:left;text-align-last:left;color:#1e3a8a;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 20px; line-height: 120%; text-decoration: none; text-transform: none;">Joined Businesses</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 16px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="left" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 16px;line-height: 20px;color:#1e3a8a;font-style:normal;font-weight:400;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">Over 7 companies trust us to streamline their customer support.</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                             <tr>
                              <td valign="top">
                               <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-right: auto;">
                                <tr>
                                 <!--[if gte mso 9]>
                    <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #081b2f14;">&nbsp;</td>
                <![endif]-->
                                 <!--[if !gte mso 9]><!-- -->
                                 <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #081b2f14;">&nbsp;</td>
                                 <!--<![endif]-->
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-0-24-0" align="left" style="padding: 0px 0px 40px 0px;">
                   <table class="pc-width-hug pc-w620-gridCollapsed-1" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 20px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="border-collapse: separate; border-spacing: 0;">
                             <tr>
                              <td valign="top" align="left">
                               <div class="pc-font-alt" style="text-decoration: none;">
                                <div style="font-size: 60px;line-height: 120%;text-align:left;text-align-last:left;color:#ff6c44;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                 <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 60px; line-height: 120%; text-decoration: none; text-transform: none;">68</span>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-grid-td-last pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 20px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 8px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 20px;line-height: 120%;text-align:left;text-align-last:left;color:#1e3a8a;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 20px; line-height: 120%; text-decoration: none; text-transform: none;">Resolved Cases</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 16px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="left" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 16px;line-height: 20px;color:#1e3a8a;font-style:normal;font-weight:400;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; text-decoration: none; text-transform: none;">More than 68 customer inquiries resolved seamlessly.</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                             <tr>
                              <td valign="top">
                               <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-right: auto;">
                                <tr>
                                 <!--[if gte mso 9]>
                    <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #081b2f14;">&nbsp;</td>
                <![endif]-->
                                 <!--[if !gte mso 9]><!-- -->
                                 <td height="1" valign="top" style="line-height: 1px; font-size: 1px; border-bottom: 1px solid #081b2f14;">&nbsp;</td>
                                 <!--<![endif]-->
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="left">
                   <table class="pc-width-hug pc-w620-gridCollapsed-1" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 20px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="left" style="border-collapse: separate; border-spacing: 0;">
                             <tr>
                              <td valign="top" align="left">
                               <div class="pc-font-alt" style="text-decoration: none;">
                                <div style="font-size: 60px;line-height: 120%;text-align:left;text-align-last:left;color:#ff6c44;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                 <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 60px; line-height: 120%; text-decoration: none; text-transform: none;">36</span>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                     <td class="pc-grid-td-last pc-w620-itemsSpacings-0-16" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 20px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="left" valign="top">
                         <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="left" valign="top">
                            <table align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 8px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 20px;line-height: 120%;text-align:left;text-align-last:left;color:#1e3a8a;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 20px; line-height: 120%; text-decoration: none; text-transform: none;">Daily Active User</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="left" valign="top">
                            <table width="100%" align="left" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 0px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="left" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="left" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 15px;line-height: 20px;color:#1e3a8a;font-style:normal;font-weight:400;letter-spacing:-0.2px;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 15px; line-height: 20px; text-decoration: none; text-transform: none;">7 businesses use our platform daily to improve their customer interactions.</span><span style="font-family: 'Inter', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 20px; letter-spacing: 0px; text-decoration: none; text-transform: none;"> </span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Numbers -->
         </td>
        </tr>
        <tr>
         <td valign="top">
          <!-- BEGIN MODULE: Footer -->
          <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
           <tr>
            <td class="pc-w620-spacing-0-0-0-0" style="padding: 0px 0px 0px 0px;">
             <table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation">
              <tr>
               <td valign="top" class="pc-w620-padding-32-32-32-32" style="padding: 40px 40px 24px 40px; height: unset; border-radius: 0px; background-color: #1e3a8a;" bgcolor="#1e3a8a">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td style="padding: 0px 0px 16px 0px;">
                   <table class="pc-width-fill pc-w620-gridCollapsed-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-grid-td-last pc-w620-itemsSpacings-0-30" align="center" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0; width: 100%;" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="center" valign="top">
                         <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 8px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="center" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="text-decoration: none;">
                                   <div style="font-size: 32px;line-height: 120%;text-align:center;text-align-last:center;color:#ffffff;letter-spacing:0px;font-weight:700;font-style:normal;font-variant-ligatures:normal;">
                                    <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 32px; line-height: 120%; text-decoration: none; text-transform: none;">Say Hello. Anytime.</span>
                                    </div>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <td valign="top" style="padding: 0px 0px 24px 0px;">
                               <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" align="center" style="border-collapse: separate; border-spacing: 0;">
                                <tr>
                                 <td valign="top" align="center" style="padding: 0px 0px 0px 0px;">
                                  <div class="pc-font-alt" style="line-height: 20px; letter-spacing: -0px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; font-weight: normal; font-variant-ligatures: normal; color: #ffffff; text-align: center; text-align-last: center;">
                                   <div><span>Reply to this email or call to connect with us.</span>
                                   </div>
                                  </div>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                          <tr>
                           <td align="center" valign="top">
                            <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                             <tr>
                              <th valign="top" align="center" style="padding: 0px 0px 16px 0px; text-align: center; font-weight: normal; line-height: 1;">
                               <!--[if mso]>
        <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
            <tr>
                <td valign="middle" align="center" style="border-top: 1px solid #ffffff; border-right: 1px solid #ffffff; border-bottom: 1px solid #ffffff; border-left: 1px solid #ffffff; background-color: transparent; text-align:center; color: #ffffff; padding: 12px 20px 12px 20px; mso-padding-left-alt: 0; margin-left:20px;" bgcolor="transparent">
                                    <a class="pc-font-alt" style="display: inline-block; text-decoration: none; font-variant-ligatures: normal; font-family: 'Work Sans', Arial, Helvetica, sans-serif; text-align: center;" href="https://designmodo.com/postcards" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#ffffff;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">+91 824 929 1789</span></span></span></a>
                                </td>
            </tr>
        </table>
        <![endif]-->
                               <!--[if !mso]><!-- -->
                               <a style="display: inline-block; box-sizing: border-box; border-top: 1px solid #ffffff; border-right: 1px solid #ffffff; border-bottom: 1px solid #ffffff; border-left: 1px solid #ffffff; background-color: transparent; padding: 12px 20px 12px 20px; font-family: 'Work Sans', Arial, Helvetica, sans-serif; vertical-align: top; text-align: center; text-align-last: center; text-decoration: none; -webkit-text-size-adjust: none; mso-hide: all;" href="https://designmodo.com/postcards" target="_blank"><span style="font-size: 16px;line-height: 24px;color:#ffffff;letter-spacing:0px;font-weight:500;font-style:normal;display:inline-block;font-variant-ligatures:normal;"><span style="display:inline-block;"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 16px; line-height: 24px; text-decoration: none; text-transform: none;">+91 824 929 1789</span></span></span></a>
                               <!--<![endif]-->
                              </th>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center" style="padding: 0px 0px 24px 0px;">
                   <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                     <td valign="top">
                      <table class="pc-width-hug pc-w620-gridCollapsed-0" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr class="pc-grid-tr-first">
                        <td class="pc-grid-td-first pc-w620-itemsSpacings-20-0" valign="middle" style="width: 50%; padding-top: 0px; padding-right: 15px; padding-bottom: 0px; padding-left: 0px;">
                         <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td align="center" valign="middle" style="padding: 0px 0px 0px 0px; border-radius: 195px 195px 195px 195px;">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                             <tr>
                              <td align="center" valign="top">
                               <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                 <td valign="top">
                                  <a class="pc-font-alt" href="https://www.linkedin.com/company/rhinontech/" target="_blank" style="text-decoration: none;">
                                   <img src="https://cloudfilesdm.com/postcards/da5980efe2580dcd4451fb5fe960df47.png" class="" width="32" height="32" style="display: block; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 32px; height: 32px;" alt="" />
                                  </a>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                        <td class="pc-grid-td-last pc-w620-itemsSpacings-20-0" valign="middle" style="width: 50%; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 15px;">
                         <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td align="center" valign="middle" style="padding: 0px 0px 0px 0px; border-radius: 282px 282px 282px 282px;">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                             <tr>
                              <td align="center" valign="top">
                               <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                 <td valign="top">
                                  <a class="pc-font-alt" href="https://www.instagram.com/rhinontech/" target="_blank" style="text-decoration: none;">
                                   <img src="https://cloudfilesdm.com/postcards/d88024b445496250a1fef25606f0eceb.png" class="" width="32" height="32" style="display: block; border: 0; outline: 0; line-height: 100%; -ms-interpolation-mode: bicubic; width: 32px; height: 32px;" alt="" />
                                  </a>
                                 </td>
                                </tr>
                               </table>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                       <tr class="pc-grid-tr-last">
                        <td class="pc-grid-td-first pc-w620-itemsSpacings-20-0" valign="middle" style="width: 50%; padding-top: 0px; padding-right: 15px; padding-bottom: 0px; padding-left: 0px;">
                         <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td align="center" valign="middle" style="padding: 0px 0px 0px 0px; border-radius: 282px 282px 282px 282px;">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                        <td class="pc-grid-td-last pc-w620-itemsSpacings-20-0" valign="middle" style="width: 50%; padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 15px;">
                         <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                          <tr>
                           <td align="center" valign="middle" style="padding: 0px 0px 0px 0px; border-radius: 279px 279px 279px 279px;">
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td class="pc-w620-spacing-0-0-20-0 pc-w620-align-center" align="center" valign="top" style="padding: 0px 0px 20px 0px;">
                   <table border="0" cellpadding="0" cellspacing="0" role="presentation" class="pc-w620-align-center" width="100%" style="border-collapse: separate; border-spacing: 0; margin-right: auto; margin-left: auto;">
                    <tr>
                     <td valign="top" class="pc-w620-padding-0-16-0-16 pc-w620-align-center" align="center" style="padding: 0px 60px 0px 60px;">
                      <div class="pc-font-alt pc-w620-align-center" style="text-decoration: none;">
                       <div style="font-size: 14px;line-height: 120%;text-align:center;text-align-last:center;color:#ffffff;letter-spacing:0px;font-weight:400;font-style:normal;font-variant-ligatures:normal;">
                        <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 140%; text-decoration: none; text-transform: none;" class="pc-w620-line-height-120pc">Cock burn road, Shivaji Nagar, Bengaluru</span>
                        </div>
                       </div>
                      </div>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                 <tr>
                  <td align="center">
                   <table class="pc-width-hug pc-w620-gridCollapsed-0" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr class="pc-grid-tr-first pc-grid-tr-last">
                     <td class="pc-grid-td-first pc-grid-td-last" valign="top" style="padding-top: 0px; padding-right: 0px; padding-bottom: 0px; padding-left: 0px;">
                      <table style="border-collapse: separate; border-spacing: 0;" border="0" cellpadding="0" cellspacing="0" role="presentation">
                       <tr>
                        <td align="center" valign="top">
                         <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%;">
                          <tr>
                           <td align="center" valign="top">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation" align="center" style="border-collapse: separate; border-spacing: 0;">
                             <tr>
                              <td valign="top" align="center">
                               <div class="pc-font-alt" style="text-decoration: none;">
                                <div style="font-size: 14px;line-height: 20px;text-align:center;text-align-last:center;color:#ffffff;letter-spacing:0px;font-weight:400;font-style:normal;font-variant-ligatures:normal;">
                                 <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 140%; text-decoration: none; text-transform: none;">No longer want to receive these emails?</span>
                                 </div>
                                 <div><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 140%; text-decoration: none; text-transform: none;">﻿</span><a href="https://designmodo.com/postcards" style="text-decoration:none;color:inherit;color: rgb(255, 255, 255);"><span style="font-family: 'Work Sans', Arial, Helvetica, sans-serif; font-size: 14px; line-height: 20px; text-decoration: underline; text-transform: none;">Unsubscribe</span></a>
                                 </div>
                                </div>
                               </div>
                              </td>
                             </tr>
                            </table>
                           </td>
                          </tr>
                         </table>
                        </td>
                       </tr>
                      </table>
                     </td>
                    </tr>
                   </table>
                  </td>
                 </tr>
                </table>
               </td>
              </tr>
             </table>
            </td>
           </tr>
          </table>
          <!-- END MODULE: Footer -->
         </td>
        </tr>
       </table>
      </td>
     </tr>
    </table>
   </td>
  </tr>
 </table>
</body>
</html>`
};

module.exports = generateMarketingEmail;