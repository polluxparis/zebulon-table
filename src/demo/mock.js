/* eslint-disable import/no-extraneous-dependencies*/
import { Observable } from "rx-lite";
/* eslint-enable */

export function getMockDatasource(
  dataRepetition = 1,
  nToto = 10,
  nTiti = 10,
  nTutu = 2
) {
  let obj = [];
  const res = [];
  let ii = 0;
  for (let k = 0; k < dataRepetition; k += 1) {
    for (let o = 0; o < nToto; o += 1) {
      for (let i = 0; i < nTiti; i += 1) {
        for (let u = 0; u < nTutu; u += 1) {
          obj = {};
          obj.toto = o;
          obj.toto_lb = `toto ${String(o)}`;
          obj.toto_0 = `att0 ${String(o)}`;
          obj.toto_1 = `att1 ${String(nToto - o)}`;
          obj.titi = i;
          obj.titi_lb = `titi ${String(i)}`;
          obj.tutu = String(Math.round((nTutu - 1) * Math.random()));
          obj.qty = Math.round(400 * Math.random()) + 125; // +9999999999.1234567890123456
          obj.amt = Math.round(5000 * Math.random()) + 310; // +9999999999.1234567890123456
          obj.d = new Date(
            2017 + Math.round(2 * Math.random()),
            Math.round(12 * Math.random()),
            Math.round(31 * Math.random())
          );
          obj.id = ii;
          res.push(obj);
          ii++;
        }
      }
    }
  }
  return res;
}

// export function getRandomMockDatasource(
//   dataPercentage = 10,
//   nToto = 10,
//   nTiti = 10,
//   nTutu = 2
// ) {
//   // return [getObj(1, 1, 0), getObj(1, 100, 1)];
//   const ratio = dataPercentage / 100;
//   // const nTutu = 2;
//   let obj = [];
//   const res = [];
//   for (let k = 0; k < 1; k += 1) {
//     for (let o = 0; o < nToto * ratio; o += 1) {
//       for (let i = 0; i < nTiti * ratio; i += 1) {
//         for (let u = 0; u < nTutu * ratio; u += 1) {
//           const oo = Math.round(Math.random() * nToto * 1.1);
//           const ii = Math.round(Math.random() * nTiti * 1);
//           obj = {};
//           obj.toto = oo;
//           obj.toto_lb = `toto ${String(oo)}`;
//           obj.toto_0 = `att0 ${String(oo)}`;
//           obj.toto_1 = `att1 ${String(nToto - oo)}`;
//           obj.titi = ii;
//           obj.titi_lb = `titi ${String(ii)}`;
//           obj.tutu = String(Math.round((nTutu - 1) * Math.random()));
//           obj.qty = 100; // Math.round(400 * Math.random()) + 125; // +9999999999.1234567890123456
//           obj.amt = Math.round(5000 * Math.random()) + 310; // +9999999999.1234567890123456
//           res.push(obj);
//         }
//       }
//     }
//   }
//   return res;
// }

export const overwritedData = () => {
  const obj = {};
  obj.toto = 1;
  obj.toto_lb = `toto ${String(1)}`;
  obj.toto_0 = `att0 ${String(1)}`;
  obj.toto_1 = `att1 ${String(199)}`;
  obj.titi = 1;
  obj.titi_lb = `titi ${String(1)}`;
  // obj.tutu = "2";
  obj.qty = 100; // Math.round(400 * Math.random()) + 125; // +9999999999.1234567890123456
  // obj.amt = Math.round(5000 * Math.random()) + 310; // +9999999999.1234567890123456
  return [obj];
};

export const getObservableMockDatasource = (
  dataRepetition = 1,
  nToto = 10,
  nTiti = 10,
  nTutu = 2
) => {
  const data = getMockDatasource(dataRepetition, nToto, nTiti, nTutu);
  console.log("count data", data.length);
  const data2 = [];
  let i = 0;
  while (i < data.length) {
    data2.push(data.slice(i, (i += 1000)));
  }

  let ii = 0;
  // return Observable.from(data2);
  return Observable.interval(100)
    .take(data2.length)
    .map(i => data2[i]);
  // return Observable.interval(interval || 100)
  //   .take(1000)
  //   .then((ii += 1000))
  //   .map(i => data[i + ii]);
};
export function getObservableError() {
  return Observable.throw(new Error("titi"));
}
export const getPromiseMockDatasource = (
  dataRepetition = 1,
  nToto = 10,
  nTiti = 10,
  nTutu = 2
) => {
  const p = new Promise(resolve => setTimeout(resolve, 20)).then(() =>
    getMockDatasource(dataRepetition, nToto, nTiti, nTutu)
  );
  return p;
};
