/* Storm groups rotate normally */
#back1, #back2, #back3, #back4, #back5 {
  animation: soul-storm 8s linear infinite;
}
@keyframes soul-storm {
  from { transform: rotate(0deg);}
  to { transform: rotate(360deg);}
}

/* When slow, storm slows down */
.soulprint-storm-slow #back1,
.soulprint-storm-slow #back2,
.soulprint-storm-slow #back3,
.soulprint-storm-slow #back4,
.soulprint-storm-slow #back5 {
  animation-duration: 20s !important; /* slower spin */
}

/* Core base */
#core {
  transition: transform 0.4s cubic-bezier(.7,1.6,.5,1);
  transform: scale(1);
}
/* Core grows when pending */
.soulprint-core-grow #core {
  transform: scale(1.17);
  filter: drop-shadow(0 0 18px #9ffcff88);
}
