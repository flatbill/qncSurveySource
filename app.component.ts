import {Component } from '@angular/core';
import api from 'src/utils/api'
//src\utils\api.js
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  siteTitle = ' QnC.   Surveys your way.'
  // //initialCountInAppComponent: number = 10
  // myCount: number = 1000;
  // myFriend = '?'
  // msgFromBeyond = '?'
  // nango = 'nangoDude'
  // gdArray1 = ['start1','start2','start3']

  // parentFun2(event) { 
  //   this.myCount = event;
  //   this.msgFromBeyond = 'msg from parentFun2'
  //  }

  // parentFun1(myFriendParmIn:string): void {
  //   this.msgFromBeyond =   " Msg from parentFun1 "
  //   this.myFriend = myFriendParmIn
  // }
  // parentFun3(gdaParmIn)   {
  //   this.gdArray1 = gdaParmIn    //  ['cars','bars','guitars']
  // }

  ngOnInit() {
  }

    ////////////////////////////////////////////////////////////////
    // launchQtRead01 = (e) => {
    //   alert('running launchQtRead01')
    //   //const wango = e.target.dataset.id
    //   // Make API request
    //   const wango = '276380634185728512'
    //   api.qtRead01(wango).then(() => {
    //     console.log(`qtRead01 ${wango}`)     
    //   }).catch((e) => {
    //     console.log(`qtRead01 error reading ${wango}`, e)
    //   })
    //   alert('done running launchQtRead01')
    // } 
    /////////////////////////////////////////////////////////////////
  
    ////////////////////////////////////////////////////////////////
    // launchQtRead02 = (e) => {
    //   alert('running launchQtRead02')
    //   //const tango = e.target.dataset.id
    //   // Make API request
    //   const tango = '276380634185728512'
    //   api.qtRead02(tango).then(() => {
    //     console.log(`qtRead02 ${tango}`)     
    //   }).catch((e) => {
    //     console.log(`qtRead02 error reading ${tango}`, e)
    //   })
    //   alert('done running launchQtRead02')
    // } 
    /////////////////////////////////////////////////////////////////

    ////////////////////////////////////////////////////////////////
    // launchQtRead03 = (e) => {
    //   alert('running launchQtRead03')
    //   //const mango = e.target.dataset.id
    //   // Make API request
    //   const mango = '276380634185728512'
    //   api.qtRead03(mango).then(() => {
    //     console.log(`qtRead03 ${mango}`)     
    //   }).catch((e) => {
    //     console.log(`qtRead03 error reading ${mango}`, e)
    //   })
    //   alert('done running launchQtRead03')
    // } 
    /////////////////////////////////////////////////////////////////
}

