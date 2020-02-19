var express = require('express');
var router = express.Router();
//var jws = require('jws');
var teepP = require("../teep-p");
var jose = require('node-jose');
var fs = require('fs');

var keystore = jose.JWK.createKeyStore();
var tee_pubkey = fs.readFileSync("./key/test-jw_tee_identity_tee-mytee-public.jwk", function (err, data) {
   console.log(data);
});

var tam_pubkey = fs.readFileSync("./key/test-jw_tsm_identity_tam-mytam-public.jwk", function (err, data) {
   console.log(data);
});

var tam_privkey = fs.readFileSync("./key/test-jw_tsm_identity_private_tam-mytam-private.jwk", function (err, data) {
   console.log(data);
});

var tee_privkey = fs.readFileSync("./key/test-jw_tee_identity_private_tee-mytee-private.jwk", function (err, data) {
   console.log(data);
});

var jwk_tam_privkey, jwk_tee_pubkey, jwk_tee_privkey, jwk_tam_pubkey;

keystore.add(tee_pubkey, "json").then(function (result) {
   jwk_tee_pubkey = result;
});
keystore.add(tam_privkey, "json").then(function (result) {
   jwk_tam_privkey = result;
});
keystore.add(tee_privkey, "json").then(function (result) {
   jwk_tee_privkey = result;
});
keystore.add(tam_pubkey, "json").then(function (result) {
   jwk_tam_pubkey = result;
});

router.get('/', function (req, res, next) {
   var param = { "key": "This is sample" };
   res.header('Content-Type', 'application/json; charset=utf-8');
   res.send(param);
});

let teepImplHandler = function (req, body) {
   let ret = null;
   if (req.headers['content-length'] == 0) {
      // body is empty
      console.log("TAM API launch");
      //Call OTrP Implementation's ProcessConnect API
      ret = teepP.initMessage();
      //res.send(JSON.stringify(ret));
      //res.end();
      return ret;
   } else {
      console.log("TAM ProcessTEEP-Pmessage instance");
      console.log(body);

      ret = teepP.parse(body,req);
      console.log("TAM ProcessTEEP-Pmessage response");
      console.log(ret);
      //
      if (ret == null) {
         //invalid message from client device
         console.log("no content");
         //res.set(null);
         //res.status(204).send('no content');
         //res.end();
         return ret;
      } else {
         //send valid response to client device
         return ret;
         //res.set(ret);
         //res.status(200);
         //res.send(JSON.stringify(ret));
         //res.end();
      }
      return;
   }
}

// no encrypt
router.post('/tam', function (req, res, next) {
   // check POST content
   console.log("Access from: "+req.ip);
   console.log(req.headers);
   console.log(req.body);
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   ret = teepImplHandler(req, req.body);

   if (ret == null) {
      res.set(null);
      res.status(204);
      res.end();
   } else {
      //res.set(ret);
      res.send(JSON.stringify(ret));
      res.end();
   }

   return;
   //if (!Object.keys(req.body).length) {
   // if (req.headers['content-length'] == 0) {
   //    // body is empty
   //    console.log("TAM API launch");
   //    //Call OTrP Implementation's ProcessConnect API
   //    ret = teepP.initMessage();
   //    res.send(JSON.stringify(ret));
   //    res.end();
   //    return;
   // } else {
   //    console.log("TAM ProcessTEEP-Pmessage instance");
   //    console.log(req.body);

   //    ret = teepP.parse(req.body);
   //    //
   //    if (ret == null) {
   //       //invalid message from client device
   //       console.log("no content");
   //       res.set(null);
   //       res.status(204).send('no content');
   //       res.end();
   //    } else {
   //       //send valid response to client device
   //       res.set(ret);
   //       res.status(200);
   //       res.send(JSON.stringify(ret));
   //       res.end();
   //    }
   //    return;
   // }
});

// no encrypt for TA delete
router.post('/tam_delete', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body);
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   ret = teepImplHandler(req, req.body);

   if (ret == null) {
      res.set(null);
      res.status(204);
      res.end();
   } else {
      //res.set(ret);
      res.send(JSON.stringify(ret));
      res.end();
   }

   return;
});

//with encrypt
router.post('/tam_jose', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body); // encrypted body
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   //decrypt & verify
   let plainRequest = null;
   let nullPromise = new Promise(function (resolve, reject) {
      resolve(null);
   });
   console.log(req.body);
   console.log(typeof req.body);
   console.log(req.headers['content-length']);
   let verifyReq = null;
   if (req.headers['content-length'] == 0) {
      console.log("null request");
      verifyReq = new Promise(function (resolve, reject) {
         let dummyObj = new Object();
         dummyObj.payload = "{}";
         resolve(dummyObj);
      });
   } else {
      const decryptReq = jose.JWE.createDecrypt(jwk_tam_privkey)
         .decrypt(req.body);
      verifyReq = decryptReq.then(function (x) {
         console.log("[verifyReq]");
         console.log(x);
         console.log(x.payload.toString());
         let temp = JSON.parse(x.payload);
         return jose.JWS.createVerify(keystore).verify(temp);
      });
   }

   const signRes = verifyReq.then(function (x) {
      console.log("[signRes]");
      console.log(x.payload.toString());
      let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
      if (response == null) {
         return nullPromise;
      } else {
         return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(JSON.stringify(response)).final();
      }
   })
   const encryptRes = signRes.then(function (x) {
      console.log("[encryptRes]");
      console.log(x);
      if (x == null) {
         return nullPromise;
      } else {
         return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(Buffer.from(JSON.stringify(x))).final();
      }
   });
   const finalize = encryptRes.then(function (x) {
      console.log("[finally sending]");
      console.log(x);
      if (x == null) {
         res.set(null);
         res.status(204);
         res.end();
      } else {
         //res.set(ret);
         res.send(JSON.stringify(x));
         res.end();
      }
   });
   //console.log(plainRequest);
   // jose.JWS.createVerify(keystore)
   //    .verify(JSON.stringify(plainRequest))
   //    .then(function (result) {
   //       console.log(result);
   // });
   return;

   //process content
   // ret = teepImplHandler(plainRequest);

   // //encrypt(TBF)
   // let encryptedResponse = null;
   // jose.JWE.createEncrypt(keystore)
   //    .update(ret)
   //    .final()
   //    .then(function(x){
   //       encryptedResponse = x;
   //    });

   // if (ret == null) {
   //    res.set(null);
   //    res.status(204);
   //    res.end();
   // } else {
   //    //res.set(ret);
   //    res.send(JSON.stringify(encryptedResponse));
   //    res.end();
   // }

   // return;


});

//with encrypt2(enc-then-sign)
router.post('/tam_jose2', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body); // encrypted body
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   //~~decrypt & verify~~ => verify & decrypt
   let plainRequest = null;
   let nullPromise = new Promise(function (resolve, reject) {
      resolve(null);
   });
   console.log(req.body);
   console.log(typeof req.body);
   console.log(req.headers['content-length']);
   let afterDecryptReq = null;
   if (req.headers['content-length'] == 0) {
      console.log("null request");
      afterDecryptReq = new Promise(function (resolve, reject) {
         let dummyObj = new Object();
         dummyObj.payload = "{}";
         resolve(dummyObj);
      });
   } else {
      const firstVerifyReq = jose.JWS.createVerify(keystore)
         .verify(req.body);
      afterDecryptReq = firstVerifyReq.then(function (x) {
         console.log("[verifyReq2]");
         console.log(x);
         console.log(x.payload.toString());
         let temp = JSON.parse(x.payload);
         return jose.JWE.createDecrypt(keystore).decrypt(jwk_tam_privkey);
      });
   }

   //encrypt then sign!
   const firstEncryptRes = afterDecryptReq.then(function (x) {
      console.log("[encryptRes]");
      console.log(x.payload.toString());
      let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
      if (response == null) {
         return nullPromise;
      } else {
         return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(JSON.stringify(response)).final();
      }
   })
   const afterSignRes = firstEncryptRes.then(function (x) {
      console.log("[signRes]");
      console.log(x);
      if (x == null) {
         return nullPromise;
      } else {
         return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(Buffer.from(JSON.stringify(x))).final();
      }
   });
   const finalize = afterSignRes.then(function (x) {
      console.log("[finally sending]");
      console.log(x);
      if (x == null) {
         res.set(null);
         res.status(204);
         res.end();
      } else {
         //res.set(ret);
         res.send(JSON.stringify(x));
         res.end();
      }
   });
   //console.log(plainRequest);
   // jose.JWS.createVerify(keystore)
   //    .verify(JSON.stringify(plainRequest))
   //    .then(function (result) {
   //       console.log(result);
   // });
   return;

});

//with encrypt
router.post('/tam_jose_delete', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body); // encrypted body
   let ret = null;

   //set response header
   res.set({
      'Content-Type': 'application/teep+json',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'",
      'Referrer-Policy': 'no-referrer'
   });

   //decrypt & verify
   let plainRequest = null;
   let nullPromise = new Promise(function (resolve, reject) {
      resolve(null);
   });
   console.log(req.body);
   console.log(typeof req.body);
   console.log(req.headers['content-length']);
   let verifyReq = null;
   if (req.headers['content-length'] == 0) {
      console.log("null request");
      verifyReq = new Promise(function (resolve, reject) {
         let dummyObj = new Object();
         dummyObj.payload = "{}";
         resolve(dummyObj);
      });
   } else {
      const decryptReq = jose.JWE.createDecrypt(jwk_tam_privkey)
         .decrypt(req.body);
      verifyReq = decryptReq.then(function (x) {
         console.log("[verifyReq]");
         console.log(x);
         console.log(x.payload.toString());
         let temp = JSON.parse(x.payload);
         return jose.JWS.createVerify(keystore).verify(temp);
      });
   }

   const signRes = verifyReq.then(function (x) {
      console.log("[signRes]");
      console.log(x.payload.toString());
      let response = teepImplHandler(req, JSON.parse(x.payload.toString()));
      if (response == null) {
         return nullPromise;
      } else {
         return jose.JWS.createSign({ format: 'flattened' }, jwk_tam_privkey).update(JSON.stringify(response)).final();
      }
   })
   const encryptRes = signRes.then(function (x) {
      console.log("[encryptRes]");
      console.log(x);
      if (x == null) {
         return nullPromise;
      } else {
         return jose.JWE.createEncrypt({ fields: { alg: 'RSA1_5' }, format: 'flattened' }, jwk_tee_pubkey).update(Buffer.from(JSON.stringify(x))).final();
      }
   });
   const finalize = encryptRes.then(function (x) {
      console.log("[finally sending]");
      console.log(x);
      if (x == null) {
         res.set(null);
         res.status(204);
         res.end();
      } else {
         //res.set(ret);
         res.send(JSON.stringify(x));
         res.end();
      }
   });
   //console.log(plainRequest);
   // jose.JWS.createVerify(keystore)
   //    .verify(JSON.stringify(plainRequest))
   //    .then(function (result) {
   //       console.log(result);
   // });
   return;

   //process content
   // ret = teepImplHandler(plainRequest);

   // //encrypt(TBF)
   // let encryptedResponse = null;
   // jose.JWE.createEncrypt(keystore)
   //    .update(ret)
   //    .final()
   //    .then(function(x){
   //       encryptedResponse = x;
   //    });

   // if (ret == null) {
   //    res.set(null);
   //    res.status(204);
   //    res.end();
   // } else {
   //    //res.set(ret);
   //    res.send(JSON.stringify(encryptedResponse));
   //    res.end();
   // }

   // return;


});

router.post('/install', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body);
   var f_pt = fs.readFileSync("./TAs/dummy2.ta", function (err, data) {
      console.log(err);
   });

   jose.JWE.createEncrypt({ alg: 'RSA1_5', contentAlg: 'A128CBC-HS256', format: "flattened" }, jwk_tee_pubkey)
      .update(f_pt).final().then(function (result) {
         f = JSON.stringify(result);

         jose.JWS.createSign({ alg: 'RS256', format: 'flattened' }, jwk_tam_privkey)
            .update(f).final().then(function (result) {
               f = JSON.stringify(result);
               res.statusCode = 200;
               res.set({
                  'Content-Type': 'application/teep+json',
                  'Cache-Control': 'no-store',
                  'X-Content-Type-Options': 'nosniff',
                  'Content-Security-Policy': "default-src 'none'",
                  'Referrer-Policy': 'no-referrer'
               });
               res.setHeader('Content-Length', f.length);
               res.end(f);
            });
      });
});

router.post('/delete', function (req, res, next) {
   // check POST content
   console.log(req.headers);
   console.log(req.body);

   var cmd = "{\"delete-ta\":\"8d82573a-926d-4754-9353-32dc29997f74.ta\"}";
   console.log("Request for delete packet\n");

   jose.JWE.createEncrypt({ alg: 'RSA1_5', contentAlg: 'A128CBC-HS256', format: "flattened" },
      jwk_tee_pubkey).update(cmd).final().then
      (function (result) {
         f = JSON.stringify(result);

         jose.JWS.createSign({ alg: 'RS256', format: 'flattened' }, jwk_tam_privkey).update(f).final().then
            (function (result) {
               f = JSON.stringify(result);
               res.statusCode = 200;
               res.set({
                  'Content-Type': 'application/teep+json',
                  'Cache-Control': 'no-store',
                  'X-Content-Type-Options': 'nosniff',
                  'Content-Security-Policy': "default-src 'none'",
                  'Referrer-Policy': 'no-referrer'
               });
               res.setHeader('Content-Length', f.length);
               res.end(f);
            });
      });
});

let signAndEncrypt = function (data) {
   const p = new Promise((resolve, reject) => {
      jose.JWS.createSign({ format: "flattened" }, jwk_tee_privkey).update(JSON.stringify(data)).final().then(
         function (result) {
            console.log(result);
            console.log(typeof result);
            //signedRequest = result;
            jose.JWE.createEncrypt({format:"flattened", fields: { alg: 'RSA1_5' } }, jwk_tam_privkey)
               .update(JSON.stringify(result))
               .final().then(
                  async function (ret) {
                     console.log(ret);
                     val = ret;
                     //return ret;
                     resolve(ret);
                  }
               );
         }
      );
   });
   return p;
};

router.get('/testgen', function (req, res) {
   //sign and encrypt by TEEP agent key
   //QueryResponse
   let sampleRequest = { "TYPE": 5, "TOKEN": "1", "TA_LIST": [{ "Vendor_ID": "ietf-teep-wg" }] };

   //signAndEncrypt(sampleRequest);
   signAndEncrypt(sampleRequest).then((val) => {
      res.status(200);
      console.log(val)
      res.send(val);
      res.end();
   });
});
module.exports = router;