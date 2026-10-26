import { Fragment } from 'react';

// Teks yang dikelola lewat webview/mobile: baris baru = <br>, **kata** = sorotan <span>.
// Hanya menghasilkan elemen React (bukan HTML mentah), jadi isi apa pun tetap tampil sebagai teks.
export default function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split('**').map((bagian, i) => {
        const isi = bagian.split('\n').flatMap((baris, j) => (j === 0 ? [baris] : [<br key={`b${j}`} />, baris]));
        return i % 2 === 1 ? <span key={i}>{isi}</span> : <Fragment key={i}>{isi}</Fragment>;
      })}
    </>
  );
}
