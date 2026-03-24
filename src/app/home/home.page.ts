import { Component } from '@angular/core';
import { Firestore, collectionData, collection } from '@angular/fire/firestore';
import { Auth, signInAnonymously, UserCredential } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { Location, LocationRequest } from '../models/Location';
import { LocationType } from '../models/LocationType';
import { Geolocation, GeolocationPluginPermissions } from '@capacitor/geolocation';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor(private firestore: Firestore, private auth: Auth) {

    //connextion
    signInAnonymously(this.auth).then(async (value: UserCredential) => {

       const ref3 = doc(this.firestore, 'location_types', ' beach');
            const docSnap1 = await getDoc(ref3);

           console.log(docSnap1.data());

       //get all collection
      const userProfileCollection = collection(this.firestore, 'location_types');
      collectionData(userProfileCollection).subscribe(async (value)=>{

      //créer une document
      const ref = collection(this.firestore, 'locations');
       const locationTypeRef = doc(this.firestore, 'location_types', 'beach');

      const location = new LocationRequest();
        location.name = 'plge test';
        location.altitude = 10;
        location.longitude = 49.293633358861356;
        location.latitude = -0.12244389441948167;
        location.date = new Date();
        location.typeRef = locationTypeRef

        // création dnew document
        const newCityRef = doc(ref);
  console.log({ ...location })

       /* const a =  await addDoc(ref,  { ...location });
        console.log(a)*/

        //get un document
         const ref1 = doc(this.firestore, 'locations', 'uWMfutuD5V0o1E1k3rod');
         const docSnap = await getDoc(ref1);

          const ref2 = doc(this.firestore, 'location_types', 'beach');
            const docSnap1 = await getDoc(ref2);
           var b = docSnap.data() as Location; console.log(b);
          b.type = (docSnap1.data() as LocationType).name;
           console.log(b);
        })

        
  })
  .catch((error) => {alert(error.message)
    const errorCode = error.code;
    const errorMessage = error.message;
    // ...
  });


  onAuthStateChanged(auth, (user) => {
  if (user) {
  console.log("user : ",user);

    // ...
  } else {
   signInAnonymously(this.auth)
  }
});
  }

  async ngOnInit() { alert();
     const perm1 = await Geolocation.checkPermissions();

       if(perm1.location == "granted"){
      const perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation']})

    if(perm.location == "granted"){
      alert("ok")
    }else{
        alert("pas ok")
    }
    }else{
        alert("pas ok")
    }

   
const loc = await  Geolocation.getCurrentPosition().catch(()=>{
alert("pas activ")
});
  alert(loc?.coords.altitude)
   alert(loc?.coords.latitude)
    alert(loc?.coords.longitude)
  }
}
