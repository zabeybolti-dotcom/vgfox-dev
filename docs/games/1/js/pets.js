'use strict';
/* ===== Вся графика зверят, нор и декора (SVG) ===== */

const EYES=(cx1,cx2,cy,r,pupil)=>`<g class="eye-open">
<ellipse cx="${cx1}" cy="${cy}" rx="${r}" ry="${r*1.12}" fill="#fff"/><circle cx="${cx1+.8}" cy="${cy+1}" r="${r*.72}" fill="${pupil}"/><circle cx="${cx1+r*.35}" cy="${cy-r*.3}" r="${r*.3}" fill="#fff"/><circle cx="${cx1-r*.3}" cy="${cy+r*.45}" r="${r*.16}" fill="#fff" opacity=".7"/>
<ellipse cx="${cx2}" cy="${cy}" rx="${r}" ry="${r*1.12}" fill="#fff"/><circle cx="${cx2+.8}" cy="${cy+1}" r="${r*.72}" fill="${pupil}"/><circle cx="${cx2+r*.35}" cy="${cy-r*.3}" r="${r*.3}" fill="#fff"/><circle cx="${cx2-r*.3}" cy="${cy+r*.45}" r="${r*.16}" fill="#fff" opacity=".7"/></g>`;
const EYES_BEAD=(cx1,cx2,cy,r)=>`<g class="eye-open">
<circle cx="${cx1}" cy="${cy}" r="${r}" fill="#2b1b12"/><circle cx="${cx1+r*.32}" cy="${cy-r*.35}" r="${r*.34}" fill="#fff"/><circle cx="${cx1-r*.35}" cy="${cy+r*.3}" r="${r*.15}" fill="#fff" opacity=".7"/>
<circle cx="${cx2}" cy="${cy}" r="${r}" fill="#2b1b12"/><circle cx="${cx2+r*.32}" cy="${cy-r*.35}" r="${r*.34}" fill="#fff"/><circle cx="${cx2-r*.35}" cy="${cy+r*.3}" r="${r*.15}" fill="#fff" opacity=".7"/></g>`;
const EYES_HAPPY=(y,sw,col)=>`<g class="eye-happy"><path d="M38 ${y} Q45 ${y-9} 52 ${y}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round"/><path d="M68 ${y} Q75 ${y-9} 82 ${y}" stroke="${col}" stroke-width="${sw}" fill="none" stroke-linecap="round"/></g>`;
const EYES_DIZZY=`<g class="eye-dizzy"><path d="M40 60 L50 70 M50 60 L40 70" stroke="#3a2a20" stroke-width="3.6" stroke-linecap="round"/><path d="M70 60 L80 70 M80 60 L70 70" stroke="#3a2a20" stroke-width="3.6" stroke-linecap="round"/><g class="orb"><path d="M26 26 Q28 32 34 34 Q28 36 26 42 Q24 36 18 34 Q24 32 26 26Z" fill="#ffd54f"/><path d="M94 20 Q95.5 25 100 26 Q95.5 27 94 32 Q92.5 27 88 26 Q92.5 25 94 20Z" fill="#ffd54f"/><path d="M60 6 Q61.5 11 66 12 Q61.5 13 60 18 Q58.5 13 54 12 Q58.5 11 60 6Z" fill="#ffe082"/></g></g>`;
const LAUGH=(y,teeth)=>`<g class="mouth-laugh"><path d="M47 ${y} Q60 ${y+8} 73 ${y} Q60 ${y+22} 47 ${y}Z" fill="#8d3b3b"/><ellipse cx="60" cy="${y+10}" rx="7.5" ry="5" fill="#ff7b93"/>${teeth?`<rect x="54.5" y="${y+1.5}" width="11" height="7.5" rx="2.2" fill="#fff"/><line x1="60" y1="${y+2}" x2="60" y2="${y+8.5}" stroke="#e0e0e0" stroke-width="1"/>`:''}</g>`;
const BLUSH=(cy,col,r)=>`<g class="blush"><circle cx="30" cy="${cy}" r="${r}" fill="${col}"/><circle cx="90" cy="${cy}" r="${r}" fill="${col}"/></g>`;
const WHISK=(c1)=>`<g class="whisk-l" stroke="${c1}" stroke-width="1.6" opacity=".5" stroke-linecap="round"><path d="M40 84 L20 80"/><path d="M40 88 L19 90"/></g><g class="whisk-r" stroke="${c1}" stroke-width="1.6" opacity=".5" stroke-linecap="round"><path d="M80 84 L100 80"/><path d="M80 88 L101 90"/></g>`;

const PETS={
mole:`<svg viewBox="0 0 120 130" class="pet-svg mole"><g class="a-sway"><g class="a-react">
<ellipse cx="23" cy="56" rx="8" ry="9" fill="#7a5a4c"/><ellipse cx="97" cy="56" rx="8" ry="9" fill="#7a5a4c"/>
<path d="M52 31 Q54 20 58 28 Q60 17 64 27 Q67 20 69 31 Q60 26 52 31 Z" fill="#6d4c41"/>
<ellipse cx="60" cy="74" rx="42" ry="44" fill="url(#gMoleBody)"/>
<ellipse cx="60" cy="88" rx="27" ry="19" fill="url(#gMoleBelly)"/>
${EYES(45,75,64,5.5,'#33211a')}${EYES_HAPPY(65,4,'#33211a')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="80" rx="10" ry="7.5" fill="url(#gMoleNose)"/><ellipse cx="56.5" cy="77" rx="3.5" ry="2" fill="#fff" opacity=".55"/></g>
<path class="mouth-small" d="M52 93 Q60 98 68 93" stroke="#5d4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
${LAUGH(91,false)}${BLUSH(86,'#ff8a80',7)}${WHISK('#4e342e')}
<g class="paw paw-l"><ellipse cx="26" cy="103" rx="13" ry="9.5" fill="#8d6e63" transform="rotate(-10 26 103)"/><path d="M15 98 L10 95 M15.5 103 L10 102 M18 108 L13.5 110" stroke="#efe3d6" stroke-width="2.6" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="94" cy="103" rx="13" ry="9.5" fill="#8d6e63" transform="rotate(10 94 103)"/><path d="M105 98 L110 95 M104.5 103 L110 102 M102 108 L106.5 110" stroke="#efe3d6" stroke-width="2.6" stroke-linecap="round"/></g>
</g></g></svg>`,

bunny:`<svg viewBox="0 0 120 130" class="pet-svg bunny"><g class="a-sway"><g class="a-react">
<g class="ear-l"><ellipse cx="44" cy="18" rx="10.5" ry="28" fill="#f7f7f7" transform="rotate(-7 44 18)"/><ellipse cx="44" cy="20" rx="5.5" ry="20" fill="url(#gBunEar)" transform="rotate(-7 44 20)"/></g>
<g class="ear-r"><ellipse cx="76" cy="18" rx="10.5" ry="28" fill="#f7f7f7" transform="rotate(7 76 18)"/><ellipse cx="76" cy="20" rx="5.5" ry="20" fill="url(#gBunEar)" transform="rotate(7 76 20)"/></g>
<ellipse cx="60" cy="80" rx="41" ry="41" fill="url(#gBunBody)"/>
<ellipse cx="60" cy="93" rx="26" ry="17" fill="#ffffff" opacity=".5"/>
${EYES(45,75,66,6.2,'#4e342e')}${EYES_HAPPY(67,4,'#4e342e')}${EYES_DIZZY}
<path d="M54 82 L66 82 L60 89.5 Z" fill="#f48fb1"/><ellipse cx="58" cy="83.3" rx="2" ry="1.1" fill="#fff" opacity=".55"/>
<path class="mouth-small" d="M52 93 Q56 97 60 93 Q64 97 68 93" stroke="#a1887f" stroke-width="2.2" fill="none" stroke-linecap="round"/>
${LAUGH(91,true)}${BLUSH(85,'#ffab91',7)}${WHISK('#bdbdbd')}
<g class="paw paw-l"><ellipse cx="28" cy="104" rx="11" ry="8.5" fill="#f7f7f7" transform="rotate(-12 28 104)"/><path d="M22 100 L20 96.5 M26.5 98 L26 94.5 M31 98.5 L32 95" stroke="#ddd" stroke-width="1.8" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="92" cy="104" rx="11" ry="8.5" fill="#f7f7f7" transform="rotate(12 92 104)"/><path d="M98 100 L100 96.5 M93.5 98 L94 94.5 M89 98.5 L88 95" stroke="#ddd" stroke-width="1.8" stroke-linecap="round"/></g>
</g></g></svg>`,

hedgehog:`<svg viewBox="0 0 120 130" class="pet-svg hedgehog"><g class="a-sway"><g class="a-react">
<g class="spikes"><path d="M16 70 L19 42 L28 60 L33 32 L42 54 L50 26 L58 50 L66 24 L74 50 L82 30 L89 56 L97 40 L104 70 Q60 48 16 70 Z" fill="url(#gHogSpikes)"/><path d="M26 66 L30 48 L36 60 L44 40 L52 58 L60 38 L68 58 L76 42 L84 60 L92 48 L96 66 Q60 54 26 66Z" fill="#8d6e63" opacity=".5"/></g>
<g class="apple"><circle cx="88" cy="36" r="8" fill="#e53935"/><circle cx="85" cy="33" r="2.4" fill="#ff8a80" opacity=".85"/><path d="M88 28 Q89 24 92.5 22" stroke="#5d4037" stroke-width="2.2" fill="none" stroke-linecap="round"/><ellipse cx="94.5" cy="22.5" rx="4" ry="2" fill="#66bb6a" transform="rotate(-20 94.5 22.5)"/></g>
<circle cx="23" cy="66" r="7" fill="#8d6e63"/><circle cx="97" cy="66" r="7" fill="#8d6e63"/>
<ellipse cx="60" cy="78" rx="39" ry="38" fill="url(#gHogBody)"/>
<ellipse cx="60" cy="91" rx="24" ry="16" fill="#efe6dd"/>
${EYES_BEAD(46,74,66,5)}${EYES_HAPPY(67,4,'#2b1b12')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="86" rx="7" ry="5.2" fill="#2b2b2b"/><ellipse cx="57.8" cy="84.3" rx="2.4" ry="1.5" fill="#fff" opacity=".45"/></g>
<path class="mouth-small" d="M53 95 Q60 99.5 67 95" stroke="#5d4037" stroke-width="2.3" fill="none" stroke-linecap="round"/>
${LAUGH(92,false)}${BLUSH(89,'#ffab91',6.5)}
<g class="paw paw-l"><ellipse cx="31" cy="107" rx="9.5" ry="7" fill="#a1887f"/><path d="M26 104 L24.5 101.5 M30 103 L29.5 100.5 M34 104 L35 101.5" stroke="#7a5d53" stroke-width="1.6" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="89" cy="107" rx="9.5" ry="7" fill="#a1887f"/><path d="M94 104 L95.5 101.5 M90 103 L90.5 100.5 M86 104 L85 101.5" stroke="#7a5d53" stroke-width="1.6" stroke-linecap="round"/></g>
</g></g></svg>`,

fox:`<svg viewBox="0 0 120 130" class="pet-svg fox"><g class="a-sway"><g class="a-react">
<g class="tail"><path d="M84 112 Q112 102 112 70 Q112 46 98 36 Q106 58 99 76 Q92 94 78 100 Z" fill="url(#gFoxBody)"/><path d="M98 36 Q106 58 99 76 Q107 62 108 49 Q107 40 98 36 Z" fill="#fff8f0"/></g>
<g class="ear-l"><path d="M24 54 L28 14 L54 42 Z" fill="url(#gFoxBody)"/><path d="M31 47 L33.5 24 L47 41 Z" fill="#5d4037" opacity=".7"/><path d="M28 14 L25.5 30 L35.5 26 Z" fill="#3e2723"/></g>
<g class="ear-r"><path d="M96 54 L92 14 L66 42 Z" fill="url(#gFoxBody)"/><path d="M89 47 L86.5 24 L73 41 Z" fill="#5d4037" opacity=".7"/><path d="M92 14 L94.5 30 L84.5 26 Z" fill="#3e2723"/></g>
<ellipse cx="60" cy="80" rx="40" ry="40" fill="url(#gFoxBody)"/>
<ellipse cx="60" cy="74" rx="9.5" ry="14" fill="#fff8f0" opacity=".92"/>
<ellipse cx="60" cy="93" rx="27" ry="18.5" fill="url(#gFoxFace)"/>
${EYES_BEAD(45,75,68,5.2)}${EYES_HAPPY(68,4,'#2b1b12')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="87" rx="5.5" ry="4.2" fill="#2b1b12"/><ellipse cx="58.3" cy="85.6" rx="1.8" ry="1.1" fill="#fff" opacity=".5"/></g>
<path class="mouth-small" d="M53 95 Q60 99.5 67 95" stroke="#5d4037" stroke-width="2.3" fill="none" stroke-linecap="round"/>
${LAUGH(92,false)}${BLUSH(88,'#ff8a65',6.5)}
<g class="paw paw-l"><ellipse cx="28" cy="104" rx="10.5" ry="8" fill="#4e342e"/><path d="M23 100 L21.5 97 M27.5 99 L27 96 M32 100 L33 97" stroke="#33201a" stroke-width="1.6" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="92" cy="104" rx="10.5" ry="8" fill="#4e342e"/><path d="M97 100 L98.5 97 M92.5 99 L93 96 M88 100 L87 97" stroke="#33201a" stroke-width="1.6" stroke-linecap="round"/></g>
</g></g></svg>`,

hamster:`<svg viewBox="0 0 120 130" class="pet-svg hamster"><g class="a-sway"><g class="a-react">
<circle cx="27" cy="46" r="10.5" fill="url(#gHamBody)"/><circle cx="27" cy="47" r="5.5" fill="#ffcc80"/>
<circle cx="93" cy="46" r="10.5" fill="url(#gHamBody)"/><circle cx="93" cy="47" r="5.5" fill="#ffcc80"/>
<ellipse cx="60" cy="78" rx="44" ry="43" fill="url(#gHamBody)"/>
<ellipse cx="60" cy="52" rx="32" ry="16" fill="#fb8c00" opacity=".22"/>
<ellipse cx="60" cy="92" rx="30" ry="23" fill="url(#gHamBelly)"/>
${EYES_BEAD(46,74,66,5.4)}${EYES_HAPPY(67,4,'#2b1b12')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="80" rx="4.2" ry="3.1" fill="#f48fb1"/></g>
<path class="mouth-small" d="M53 88 Q56.5 92 60 88 Q63.5 92 67 88" stroke="#8d6e63" stroke-width="2.2" fill="none" stroke-linecap="round"/>
${LAUGH(89,false)}
<circle class="cheek" cx="30" cy="86" r="12.5" fill="url(#gHamCheek)" opacity=".85"/>
<circle class="cheek" cx="90" cy="86" r="12.5" fill="url(#gHamCheek)" opacity=".85"/>
${WHISK('#c98a5b')}
<g class="hold"><ellipse cx="60" cy="99" rx="5.5" ry="8" fill="#a1887f"/><ellipse cx="60" cy="99" rx="2" ry="6" fill="#7a5d4a" opacity=".5"/><path d="M60 91 L60 86.5" stroke="#6d4c41" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="51" cy="102" rx="5.5" ry="4.5" fill="#ffa726"/><ellipse cx="69" cy="102" rx="5.5" ry="4.5" fill="#ffa726"/></g>
</g></g></svg>`,

squirrel:`<svg viewBox="0 0 120 130" class="pet-svg squirrel"><g class="a-sway"><g class="a-react">
<g class="tail"><path d="M36 110 Q6 100 10 60 Q13 34 34 30 Q20 48 24 70 Q28 92 46 98 Z" fill="url(#gSqTail)"/><path d="M34 30 Q20 48 24 70 Q16 50 24 37 Q29 31 34 30 Z" fill="#f5e0c8" opacity=".9"/></g>
<g class="ear-l"><path d="M30 50 L34 22 L52 42 Z" fill="url(#gSqBody)"/><path d="M36 44 L38 30 L47 41 Z" fill="#e6c9a8" opacity=".65"/><path d="M34 22 L30.5 11 L39.5 19 Z" fill="#7a4a26"/></g>
<g class="ear-r"><path d="M90 50 L86 22 L68 42 Z" fill="url(#gSqBody)"/><path d="M84 44 L82 30 L73 41 Z" fill="#e6c9a8" opacity=".65"/><path d="M86 22 L89.5 11 L80.5 19 Z" fill="#7a4a26"/></g>
<ellipse cx="60" cy="80" rx="39" ry="39" fill="url(#gSqBody)"/>
<ellipse cx="60" cy="93" rx="25" ry="18" fill="url(#gSqBelly)"/>
${EYES_BEAD(46,74,66,5.6)}${EYES_HAPPY(67,4,'#2b1b12')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="82" rx="4.5" ry="3.4" fill="#5d4037"/><ellipse cx="58.6" cy="80.8" rx="1.5" ry="1" fill="#fff" opacity=".5"/></g>
<path class="mouth-small" d="M53 92 Q60 96.5 67 92" stroke="#6d4c41" stroke-width="2.3" fill="none" stroke-linecap="round"/>
${LAUGH(90,true)}${BLUSH(87,'#ffab91',6.5)}
<g class="hold"><path d="M52 100 Q52 113 60 113 Q68 113 68 100 Z" fill="#d7a86a"/><path d="M49.5 100.5 Q60 90 70.5 100.5 Q60 105 49.5 100.5Z" fill="#8d6e63"/><path d="M60 91.5 L60 86" stroke="#5d4037" stroke-width="2.6" stroke-linecap="round"/><ellipse cx="51" cy="103" rx="5.5" ry="4.5" fill="#c98a5b"/><ellipse cx="69" cy="103" rx="5.5" ry="4.5" fill="#c98a5b"/></g>
</g></g></svg>`,

mouse:`<svg viewBox="0 0 120 130" class="pet-svg mouse"><g class="a-sway"><g class="a-react">
<path class="tail" d="M97 99 Q119 95 116 76 Q114 65 104 63" stroke="#9fb0ba" stroke-width="5.5" fill="none" stroke-linecap="round"/>
<g class="ear-l"><circle cx="26" cy="42" r="17" fill="url(#gMouseBody)"/><circle cx="26" cy="42" r="10.5" fill="url(#gMouseEar)"/></g>
<g class="ear-r"><circle cx="94" cy="42" r="17" fill="url(#gMouseBody)"/><circle cx="94" cy="42" r="10.5" fill="url(#gMouseEar)"/></g>
<ellipse cx="60" cy="80" rx="39" ry="39" fill="url(#gMouseBody)"/>
<ellipse cx="60" cy="93" rx="25" ry="17" fill="#eef2f4"/>
${EYES_BEAD(46,74,66,5.6)}${EYES_HAPPY(67,4,'#2b1b12')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="81" rx="5.2" ry="3.9" fill="#f06292"/><ellipse cx="58.2" cy="79.6" rx="1.8" ry="1.1" fill="#fff" opacity=".6"/></g>
<path class="mouth-small" d="M53 91 Q60 95.5 67 91" stroke="#7a8b96" stroke-width="2.3" fill="none" stroke-linecap="round"/>
${LAUGH(89,false)}${BLUSH(87,'#ffab91',6.5)}${WHISK('#8fa5b0')}
<g class="paw paw-l"><ellipse cx="29" cy="105" rx="10" ry="7.5" fill="#b7c6ce"/><ellipse cx="29" cy="106" rx="5" ry="3.6" fill="#f8bbd0" opacity=".8"/></g>
<g class="paw paw-r"><ellipse cx="91" cy="105" rx="10" ry="7.5" fill="#b7c6ce"/><ellipse cx="91" cy="106" rx="5" ry="3.6" fill="#f8bbd0" opacity=".8"/></g>
</g></g></svg>`,

bear:`<svg viewBox="0 0 120 130" class="pet-svg bear"><g class="a-sway"><g class="a-react">
<g class="ear-l"><circle cx="30" cy="44" r="15" fill="url(#gBearBody)"/><circle cx="30" cy="44" r="8" fill="#e5b389"/></g>
<g class="ear-r"><circle cx="90" cy="44" r="15" fill="url(#gBearBody)"/><circle cx="90" cy="44" r="8" fill="#e5b389"/></g>
<ellipse cx="60" cy="80" rx="41" ry="41" fill="url(#gBearBody)"/>
<ellipse cx="60" cy="92" rx="18" ry="13" fill="url(#gBearMuzzle)"/>
${EYES(45,75,64,5.4,'#3e2723')}${EYES_HAPPY(65,4,'#3e2723')}${EYES_DIZZY}
<g class="nose"><ellipse cx="60" cy="84" rx="7.5" ry="5.6" fill="#4e342e"/><ellipse cx="57.4" cy="82.2" rx="2.6" ry="1.6" fill="#fff" opacity=".35"/></g>
<path class="mouth-small" d="M53 94 Q60 98 67 94" stroke="#6d4c41" stroke-width="2.4" fill="none" stroke-linecap="round"/>
${LAUGH(92,true)}${BLUSH(88,'#ffab91',7)}
<g class="paw paw-l"><ellipse cx="27" cy="105" rx="11" ry="8.5" fill="#9c6b45"/><circle cx="27" cy="106" r="4.4" fill="#e5b389" opacity=".9"/></g>
<g class="paw paw-r"><ellipse cx="93" cy="105" rx="11" ry="8.5" fill="#9c6b45"/><circle cx="93" cy="106" r="4.4" fill="#e5b389" opacity=".9"/></g>
</g></g></svg>`,

owl:`<svg viewBox="0 0 120 130" class="pet-svg owl"><g class="a-sway"><g class="a-react">
<path d="M33 48 L26 22 L49 40 Z" fill="url(#gOwlBody)"/><path d="M87 48 L94 22 L71 40 Z" fill="url(#gOwlBody)"/>
<ellipse cx="60" cy="80" rx="38" ry="41" fill="url(#gOwlBody)"/>
<ellipse cx="60" cy="90" rx="25" ry="21" fill="url(#gOwlBelly)"/>
<path d="M50 86 Q60 92 70 86 M48 94 Q60 100 72 94 M52 102 Q60 107 68 102" stroke="#c9a27b" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>
<circle cx="43" cy="63" r="12" fill="#f6ead2"/><circle cx="77" cy="63" r="12" fill="#f6ead2"/>
${EYES(43,77,63,8,'#3e2723')}${EYES_HAPPY(64,4.5,'#3e2723')}${EYES_DIZZY}
<g class="nose"><path d="M60 73 L66 81 L60 89 L54 81 Z" fill="#ffb300"/><path d="M57.5 77 L60 73 L60 81 Z" fill="#ffe082" opacity=".7"/></g>
<path class="mouth-small" d="M54 96 Q60 99 66 96" stroke="#7a5648" stroke-width="2" fill="none" stroke-linecap="round"/>
${LAUGH(94,false)}${BLUSH(88,'#ffab91',6)}
<g class="paw paw-l"><ellipse cx="30" cy="106" rx="10" ry="7" fill="#8a6a5c"/><path d="M24 103 L22 100.5 M28.5 102.5 L28 100 M33 103.5 L34.5 101" stroke="#6e4d41" stroke-width="1.7" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="90" cy="106" rx="10" ry="7" fill="#8a6a5c"/><path d="M96 103 L98 100.5 M91.5 102.5 L92 100 M87 103.5 L85.5 101" stroke="#6e4d41" stroke-width="1.7" stroke-linecap="round"/></g>
</g></g></svg>`,

frog:`<svg viewBox="0 0 120 130" class="pet-svg frog"><g class="a-sway"><g class="a-react">
<circle cx="37" cy="46" r="15" fill="url(#gFrogBody)"/><circle cx="83" cy="46" r="15" fill="url(#gFrogBody)"/>
<circle cx="37" cy="46" r="8" fill="#f4fbe6" opacity=".55"/><circle cx="83" cy="46" r="8" fill="#f4fbe6" opacity=".55"/>
<ellipse cx="60" cy="84" rx="40" ry="35" fill="url(#gFrogBody)"/>
<ellipse cx="60" cy="95" rx="27" ry="16" fill="url(#gFrogBelly)"/>
${EYES_BEAD(46,74,64,5.6)}${EYES_HAPPY(65,4,'#2b5e13')}${EYES_DIZZY}
<g class="nose"><circle cx="56" cy="77" r="2.2" fill="#33691e"/><circle cx="64" cy="77" r="2.2" fill="#33691e"/></g>
<path class="mouth-small" d="M46 88 Q60 97 74 88" stroke="#4b7a20" stroke-width="2.6" fill="none" stroke-linecap="round"/>
${LAUGH(89,false)}${BLUSH(84,'#ff8a80',7)}
<g class="paw paw-l"><ellipse cx="28" cy="106" rx="11" ry="8" fill="#6faf3e"/><path d="M22 103 L20 99.5 M27 102.5 L26.5 99 M32 103 L33.5 99.5" stroke="#4b7a20" stroke-width="1.8" stroke-linecap="round"/></g>
<g class="paw paw-r"><ellipse cx="92" cy="106" rx="11" ry="8" fill="#6faf3e"/><path d="M98 103 L100 99.5 M93 102.5 L93.5 99 M88 103 L86.5 99.5" stroke="#4b7a20" stroke-width="1.8" stroke-linecap="round"/></g>
</g></g></svg>`
};

const PET_NAMES={mole:'Кротик',bunny:'Зайчик',hedgehog:'Ёжик',fox:'Лисичка',hamster:'Хомячок',squirrel:'Белочка',
  mouse:'Мышонок',bear:'Медвежонок',owl:'Совёнок',frog:'Лягушонок'};

/* новые друзья открываются за заполненные радуги, по очереди */
const NEW_QUEUE=['mouse','bear','owl','frog'];
let unlocked=Object.keys(PETS).filter(k=>!NEW_QUEUE.includes(k));

/* ================= НОРЫ (органический SVG) ================= */
function holeBack(i){return `<svg class="hole-back" viewBox="0 0 200 144">
<defs>
<radialGradient id="dG${i}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7a5a35"/><stop offset="58%" stop-color="#6f5233"/><stop offset="76%" stop-color="#5a4025"/><stop offset="100%" stop-color="#6f5233" stop-opacity="0"/></radialGradient>
<linearGradient id="pG${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4b3016"/><stop offset="30%" stop-color="#26160a"/><stop offset="64%" stop-color="#100902"/><stop offset="100%" stop-color="#040201"/></linearGradient>
<filter id="sB${i}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
</defs>
<ellipse cx="100" cy="66" rx="98" ry="60" fill="url(#dG${i})"/>
<g filter="url(#sB${i})">
<ellipse cx="62" cy="106" rx="34" ry="10" fill="#3c2a15" opacity=".22"/>
<ellipse cx="146" cy="102" rx="30" ry="9" fill="#3c2a15" opacity=".16"/>
</g>
<ellipse cx="100" cy="62" rx="76" ry="42" fill="url(#pG${i})"/>
<path d="M38 47 A74 41 0 0 1 162 47" fill="none" stroke="#6b4a2a" stroke-width="5" opacity=".35"/>
<path d="M32 43 A76 42 0 0 1 168 43" fill="none" stroke="rgba(255,238,200,.32)" stroke-width="2.6"/>
<g stroke-linecap="round" fill="none">
<path d="M40 28 Q36 30 44 36" stroke="#2f6220" stroke-width="4"/>
<path d="M50 24 Q47 27 54 33" stroke="#3f7a2a" stroke-width="3.6"/>
<path d="M62 20 Q60 23 66 28" stroke="#2f6220" stroke-width="3.4"/>
<path d="M160 28 Q164 30 156 36" stroke="#2f6220" stroke-width="4"/>
<path d="M150 24 Q153 27 146 33" stroke="#3f7a2a" stroke-width="3.6"/>
<path d="M138 20 Q140 23 134 28" stroke="#2f6220" stroke-width="3.4"/>
<path d="M26 58 Q21 49 16 44" stroke="#3f7a2a" stroke-width="4"/>
<path d="M27 58 Q26 47 24 40" stroke="#4e8a35" stroke-width="4"/>
<path d="M28 58 Q32 49 36 45" stroke="#3f7a2a" stroke-width="3.6"/>
<path d="M174 58 Q179 49 184 44" stroke="#3f7a2a" stroke-width="4"/>
<path d="M173 58 Q174 47 176 40" stroke="#4e8a35" stroke-width="4"/>
<path d="M172 58 Q168 49 164 45" stroke="#3f7a2a" stroke-width="3.6"/>
</g>
</svg>`}

function holeFront(i){return `<svg class="hole-front" viewBox="0 0 200 144">
<defs><linearGradient id="rG${i}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="#c9a473"/><stop offset="35%" stop-color="#a37e52"/><stop offset="100%" stop-color="#6e5133"/></linearGradient></defs>
<path d="M24 62 A76 42 0 0 0 176 62 C176 90 150 110 100 110 C50 110 24 90 24 62 Z" fill="url(#rG${i})"/>
<path d="M24 62 A76 42 0 0 0 176 62" fill="none" stroke="rgba(255,244,210,.55)" stroke-width="3"/>
<ellipse cx="70" cy="88" rx="14" ry="6" fill="#000" opacity=".1"/>
<ellipse cx="132" cy="96" rx="16" ry="6" fill="#000" opacity=".09"/>
<g stroke-linecap="round" fill="none">
<path d="M70 101 Q69 92 66 86" stroke="#2f6220" stroke-width="3.8"/>
<path d="M128 101 Q129 92 132 86" stroke="#3a6f24" stroke-width="3.8"/>
<path d="M33 103 Q28 92 22 86" stroke="#3f7a2a" stroke-width="4"/>
<path d="M44 111 Q41 100 36 92" stroke="#4e8a35" stroke-width="4"/>
<path d="M166 103 Q171 93 178 87" stroke="#3f7a2a" stroke-width="4"/>
<path d="M154 111 Q158 101 164 94" stroke="#4e8a35" stroke-width="4"/>
<path d="M96 112 Q94 102 90 95" stroke="#3f7a2a" stroke-width="3.5"/>
<path d="M107 112 Q109 102 114 96" stroke="#4e8a35" stroke-width="3.5"/>
</g>
<g>
<ellipse cx="76" cy="113" rx="3.2" ry="2.1" fill="#7a5535" transform="rotate(-14 76 113)"/>
<ellipse cx="88" cy="117" rx="2.5" ry="1.7" fill="#6b4a2a" transform="rotate(10 88 117)"/>
<ellipse cx="101" cy="118.5" rx="2.8" ry="1.8" fill="#7a5535" transform="rotate(-8 101 118.5)"/>
<ellipse cx="113" cy="116" rx="2.4" ry="1.6" fill="#6b4a2a" transform="rotate(14 113 116)"/>
<ellipse cx="124" cy="112.5" rx="2.2" ry="1.5" fill="#7a5535" transform="rotate(-12 124 112.5)"/>
<ellipse cx="58" cy="108" rx="4.2" ry="2.8" fill="#9a9a8e" transform="rotate(-10 58 108)"/>
<ellipse cx="56.6" cy="107" rx="1.6" ry=".9" fill="#fff" opacity=".35" transform="rotate(-10 56.6 107)"/>
</g>
</svg>`}

/* ================= ДЕКОР ================= */
const TUFTS=[
`<svg viewBox="0 0 40 30"><path d="M8 30 Q9 14 14 6 Q12 17 13 30Z" fill="#4e8a35"/><path d="M18 30 Q19 10 25 3 Q22 14 23 30Z" fill="#57933c"/><path d="M28 30 Q29 16 34 9 Q31 18 32 30Z" fill="#4e8a35"/></svg>`,
`<svg viewBox="0 0 40 30"><path d="M10 30 Q8 16 4 9 Q10 14 13 30Z" fill="#57933c"/><path d="M20 30 Q20 12 21 4 Q24 13 24 30Z" fill="#4e8a35"/><path d="M30 30 Q33 17 38 11 Q34 18 33 30Z" fill="#57933c"/></svg>`,
`<svg viewBox="0 0 40 30"><path d="M12 30 Q13 13 18 5 Q16 16 17 30Z" fill="#4a8231"/><path d="M22 30 Q24 12 30 5 Q26 15 26 30Z" fill="#57933c"/><circle cx="19" cy="8" r="3" fill="#fff0f5"/><circle cx="19" cy="8" r="1.2" fill="#ffd54f"/></svg>`];
const FLOWERS=['#ff69b4','#ffd54f','#ff8a65','#ba68c8','#ffffff','#4fc3f7'];
function flowerSVG(c){return `<svg viewBox="0 0 44 60"><path d="M22 32 Q22 45 21 58" stroke="#4e8a35" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M22 44 Q14 40 10 44 Q16 48 22 46Z" fill="#57933c"/><path d="M22 50 Q30 46 34 50 Q28 54 22 52Z" fill="#4e8a35"/><g>${[0,72,144,216,288].map(a=>`<ellipse cx="22" cy="14" rx="7" ry="10" fill="${c}" transform="rotate(${a} 22 22)"/>`).join('')}</g><circle cx="22" cy="22" r="6" fill="#ffca28"/><circle cx="22" cy="22" r="3" fill="#ff9800"/></svg>`}
const MUSH=`<svg viewBox="0 0 40 34"><rect x="16" y="16" width="8" height="16" rx="3.5" fill="#ffe8cc"/><path d="M4 18 Q4 4 20 4 Q36 4 36 18 Q20 24 4 18Z" fill="#e55353"/><circle cx="13" cy="11" r="3" fill="#fff" opacity=".9"/><circle cx="24" cy="9" r="2.4" fill="#fff" opacity=".9"/><circle cx="29" cy="15" r="2" fill="#fff" opacity=".85"/></svg>`;
const ROCK=`<svg viewBox="0 0 44 30"><path d="M6 28 Q2 18 10 10 Q16 4 26 6 Q38 8 40 18 Q42 26 34 28Z" fill="#9e9e9e"/><path d="M10 24 Q8 16 14 11 Q19 7 26 9 Q20 12 16 18 Q13 22 10 24Z" fill="#bdbdbd" opacity=".65"/><path d="M30 26 Q36 22 36 15" stroke="#757575" stroke-width="2" fill="none" opacity=".5"/></svg>`;
const BUSH=`<svg viewBox="0 0 70 44"><ellipse cx="20" cy="32" rx="19" ry="12" fill="#57933c"/><ellipse cx="44" cy="30" rx="22" ry="14" fill="#4e8a35"/><ellipse cx="32" cy="22" rx="16" ry="11" fill="#63a446"/><circle cx="24" cy="20" r="2.2" fill="#ff8a65"/><circle cx="45" cy="16" r="2.2" fill="#ff8a65"/><circle cx="55" cy="26" r="2.2" fill="#ffd54f"/></svg>`;

function buildDecor(){
  const decoLayer=$('#decoLayer');
  for(let i=0;i<34;i++){const y=rnd(26,97),x=rnd(1,97);const sc=(.4+y/100*.95)*rnd(.75,1.25);
    const d=document.createElement('div');d.className='deco tuft'+(y>91?' front':'');
    d.style.cssText=`top:${y}%;left:${x}%;width:${34*sc}px;animation-delay:${-rnd(0,3)}s`;d.innerHTML=pick(TUFTS);decoLayer.appendChild(d);}
  for(let i=0;i<13;i++){const y=rnd(28,96),x=rnd(2,95);const sc=(.45+y/100*1)*rnd(.7,1.2);
    const d=document.createElement('div');d.className='deco flower'+(y>91?' front':'');
    d.style.cssText=`top:${y}%;left:${x}%;width:${34*sc}px;animation-delay:${-rnd(0,3)}s`;d.innerHTML=flowerSVG(pick(FLOWERS));decoLayer.appendChild(d);}
  for(let i=0;i<6;i++){const y=rnd(34,95),x=rnd(2,95);const sc=(.45+y/100)*rnd(.8,1.15);
    const d=document.createElement('div');d.className='deco'+(y>91?' front':'');
    d.style.cssText=`top:${y}%;left:${x}%;width:${30*sc}px`;d.innerHTML=pick([MUSH,ROCK,ROCK]);decoLayer.appendChild(d);}
  for(let i=0;i<4;i++){const y=rnd(38,88),x=rnd(3,90);const sc=(.5+y/100*.9)*rnd(.85,1.1);
    const d=document.createElement('div');d.className='deco';
    d.style.cssText=`top:${y}%;left:${x}%;width:${64*sc}px`;d.innerHTML=BUSH;decoLayer.appendChild(d);}

  const sky=$('#sky');
  for(let i=0;i<3;i++){const c=document.createElement('div');c.className='cloud';
    const w=rnd(22,38);
    c.style.cssText=`top:${rnd(4,16)}%;width:${w}vmin;animation-duration:${rnd(38,70)}s;animation-delay:${-rnd(0,60)}s;opacity:${rnd(.75,.95)}`;
    c.innerHTML=`<svg viewBox="0 0 120 60"><ellipse cx="34" cy="38" rx="26" ry="17" fill="#fff"/><ellipse cx="62" cy="28" rx="30" ry="21" fill="#fff"/><ellipse cx="88" cy="38" rx="24" ry="16" fill="#fff"/><ellipse cx="60" cy="46" rx="42" ry="11" fill="#f0f7ff"/></svg>`;
    sky.appendChild(c);}
}

/* ================= ЛЕТУНЫ (пчёлка, стрекоза, птичка) ================= */
const FLYERS={
bee:`<svg viewBox="0 0 120 100">
<ellipse class="wingL" cx="46" cy="24" rx="17" ry="11" fill="#e3f2fd" opacity=".85" transform="rotate(-22 46 24)"/>
<ellipse class="wingR" cx="74" cy="24" rx="17" ry="11" fill="#e3f2fd" opacity=".85" transform="rotate(22 74 24)"/>
<path d="M47 30 Q43 20 37 17 M73 30 Q77 20 83 17" stroke="#5d4037" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<circle cx="37" cy="17" r="3.2" fill="#5d4037"/><circle cx="83" cy="17" r="3.2" fill="#5d4037"/>
<clipPath id="beeClip"><ellipse cx="60" cy="56" rx="31" ry="25"/></clipPath>
<ellipse cx="60" cy="56" rx="31" ry="25" fill="url(#gBeeBody)"/>
<g clip-path="url(#beeClip)">
<rect x="42" y="26" width="12" height="64" fill="#5d4037" transform="rotate(9 48 58)"/>
<rect x="64" y="26" width="12" height="64" fill="#5d4037" transform="rotate(-9 70 58)"/>
</g>
<path d="M55 79 L60 88 L65 79 Z" fill="#5d4037"/>
<circle cx="50" cy="52" r="4.6" fill="#33221a"/><circle cx="51.6" cy="50.4" r="1.6" fill="#fff"/>
<circle cx="70" cy="52" r="4.6" fill="#33221a"/><circle cx="71.6" cy="50.4" r="1.6" fill="#fff"/>
<path d="M52 62 Q60 68 68 62" stroke="#33221a" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="42" cy="61" r="4" fill="#ff8a80" opacity=".55"/><circle cx="78" cy="61" r="4" fill="#ff8a80" opacity=".55"/>
</svg>`,
dragonfly:`<svg viewBox="0 0 120 100">
<ellipse class="wingL" cx="38" cy="34" rx="22" ry="8" fill="#b3e5fc" opacity=".75" transform="rotate(-24 38 34)"/>
<ellipse class="wingL" cx="40" cy="52" rx="20" ry="7" fill="#b3e5fc" opacity=".6" transform="rotate(16 40 52)"/>
<ellipse class="wingR" cx="66" cy="34" rx="22" ry="8" fill="#b3e5fc" opacity=".75" transform="rotate(24 66 34)"/>
<ellipse class="wingR" cx="64" cy="52" rx="20" ry="7" fill="#b3e5fc" opacity=".6" transform="rotate(-16 64 52)"/>
<ellipse cx="60" cy="52" rx="33" ry="9" fill="#4dd0e1"/>
<path d="M42 48 L44 56 M56 47 L56 57 M70 48 L68 56" stroke="#0097a7" stroke-width="3" stroke-linecap="round"/>
<circle cx="90" cy="50" r="12" fill="#26c6da"/>
<circle cx="86" cy="46" r="4.4" fill="#004d55"/><circle cx="87.4" cy="44.6" r="1.5" fill="#fff"/>
<circle cx="95" cy="46" r="4.4" fill="#004d55"/><circle cx="96.4" cy="44.6" r="1.5" fill="#fff"/>
<path d="M88 57 Q92 60 96 57" stroke="#004d55" stroke-width="2.4" fill="none" stroke-linecap="round"/>
</svg>`,
bird:`<svg viewBox="0 0 120 100">
<path class="wingL" d="M52 48 Q20 26 8 34 Q22 44 30 52 Q22 58 14 64 Q34 64 52 56 Z" fill="#90caf9"/>
<ellipse cx="62" cy="52" rx="27" ry="23" fill="#64b5f6"/>
<ellipse cx="64" cy="60" rx="17" ry="12" fill="#bbdefb"/>
<path d="M88 46 L102 50 L88 56 Z" fill="#ffb300"/>
<circle cx="76" cy="44" r="5.4" fill="#263238"/><circle cx="77.8" cy="42.2" r="1.9" fill="#fff"/>
<path d="M64 54 Q70 58 76 54" stroke="#37474f" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<circle cx="56" cy="52" r="4" fill="#ffd54f" opacity=".8"/><circle cx="62" cy="40" r="3" fill="#ffd54f" opacity=".7"/>
</svg>`};

/* ================= ШАРИК, ЗВЕЗДА, ЛИСТ ================= */
const BALLOON_COLORS=['#ef5350','#ffb74d','#66bb6a','#42a5f5','#ab47bc','#ec407a','#ffee58'];
function balloonSVG(c){return `<svg viewBox="0 0 100 150">
<path d="M50 96 Q45 122 50 148" stroke="#9e9e9e" stroke-width="2" fill="none" opacity=".7"/>
<path d="M44 92 Q50 86 56 92 L50 102 Z" fill="${c}" opacity=".85"/>
<ellipse cx="50" cy="52" rx="34" ry="42" fill="${c}"/>
<ellipse cx="38" cy="34" rx="10" ry="15" fill="#fff" opacity=".45" transform="rotate(-18 38 34)"/>
<circle cx="40" cy="52" r="4.4" fill="#33221a"/><circle cx="41.4" cy="50.6" r="1.5" fill="#fff"/>
<circle cx="60" cy="52" r="4.4" fill="#33221a"/><circle cx="61.4" cy="50.6" r="1.5" fill="#fff"/>
<path d="M42 62 Q50 69 58 62" stroke="#33221a" stroke-width="3" fill="none" stroke-linecap="round"/>
<circle cx="33" cy="61" r="3.6" fill="#fff" opacity=".35"/><circle cx="67" cy="61" r="3.6" fill="#fff" opacity=".35"/>
</svg>`}

const STAR_SVG=`<svg viewBox="0 0 60 60"><path d="M30 2 L37 22 L58 22 L41 35 L47 56 L30 43 L13 56 L19 35 L2 22 L23 22 Z" fill="#ffd54f" stroke="#ffb300" stroke-width="2"/><circle cx="24" cy="23" r="3" fill="#fff8e1"/></svg>`;

const LEAF_COLORS=['#8bc34a','#aed581','#ffb74d','#ff8a65'];
function leafSVG(c){return `<svg viewBox="0 0 40 40"><path d="M20 4 Q34 14 30 30 Q20 38 8 30 Q6 14 20 4Z" fill="${c}"/><path d="M20 8 Q21 22 20 34" stroke="#5d4037" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/></svg>`}
