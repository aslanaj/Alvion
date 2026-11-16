/* Estimator data: starting prices per vehicle and the artwork that goes with each one.
   vehicles: [label, type, vinyl, clear PPF, color PPF, full-front PPF, tint, ceramic]
   art: one entry per vehicle, same order. Images live in assets/vehicles/<slug>.webp with a paint map
   in <slug>-mask.webp (red = painted panels, green = glass). Sizes are in a 512-wide grid. */
window.Alvion = window.Alvion || {};
Alvion.estimatorCatalog = {
 "vehicles": [
  [
   "Tesla",
   "sedan",
   2990,
   4490,
   5690,
   2240,
   690,
   null
  ],
  [
   "Cybertruck",
   "cyber",
   2990,
   null,
   null,
   null,
   840,
   null
  ],
  [
   "Sedan",
   "sedan",
   3890,
   5390,
   6300,
   2390,
   590,
   990
  ],
  [
   "Coupe",
   "coupe",
   3890,
   5390,
   6300,
   2390,
   590,
   990
  ],
  [
   "S-Class",
   "luxury",
   4860,
   6740,
   7880,
   2990,
   null,
   null
  ],
  [
   "Porsche / Corvette",
   "sport",
   4790,
   6300,
   6900,
   2390,
   null,
   null
  ],
  [
   "SUV",
   "suv",
   4490,
   6450,
   7050,
   2540,
   740,
   null
  ],
  [
   "Pickup",
   "pickup",
   5240,
   7050,
   7650,
   null,
   null,
   null
  ],
  [
   "G-Wagon",
   "box",
   7050,
   9450,
   10950,
   null,
   null,
   null
  ]
 ],
 "art": [
  {
   "slug": "tesla",
   "height": 194,
   "wheels": [
    [
     105.0,
     148.0,
     38
    ],
    [
     410.0,
     142.0,
     38
    ]
   ]
  },
  {
   "slug": "cybertruck",
   "height": 210,
   "wheels": [
    [
     95.0,
     158.0,
     44
    ],
    [
     417.0,
     157.0,
     44
    ]
   ]
  },
  {
   "slug": "sedan",
   "height": 210,
   "wheels": [
    [
     107.0,
     159.0,
     41
    ],
    [
     411.0,
     160.0,
     41
    ]
   ]
  },
  {
   "slug": "coupe",
   "height": 170,
   "wheels": [
    [
     110.0,
     129.0,
     35
    ],
    [
     408.0,
     126.0,
     35
    ]
   ]
  },
  {
   "slug": "s-class",
   "height": 210,
   "wheels": [
    [
     109.0,
     156.0,
     40
    ],
    [
     420.0,
     159.0,
     40
    ]
   ]
  },
  {
   "slug": "sport",
   "height": 210,
   "wheels": [
    [
     91.0,
     152.0,
     39
    ],
    [
     393.0,
     157.0,
     39
    ]
   ]
  },
  {
   "slug": "suv",
   "height": 230,
   "wheels": [
    [
     104.0,
     177.0,
     42
    ],
    [
     413.0,
     177.0,
     43
    ]
   ]
  },
  {
   "slug": "pickup",
   "height": 230,
   "wheels": [
    [
     97.0,
     171.0,
     41
    ],
    [
     423.0,
     174.0,
     42
    ]
   ]
  },
  {
   "slug": "g-wagon",
   "height": 230,
   "wheels": [
    [
     121.0,
     175.0,
     40
    ],
    [
     406.0,
     177.0,
     40
    ]
   ]
  }
 ]
};
