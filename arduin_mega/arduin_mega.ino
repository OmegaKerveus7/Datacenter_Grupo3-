void setup() {
  Serial1.begin(9600);
  Serial.begin(9600);
  Serial.println("Iniciando prueba suma...");
}

int num = 0;

void loop() {
  Serial1.println(num);
  Serial.print("Envie: ");
  Serial.println(num);

  if (Serial1.available()) {
    String r = Serial1.readStringUntil('\n');
    r.trim();
    if (r.length() > 0) {
      Serial.print("Recibi: ");
      Serial.println(r);
    }
  }

  num++;
  delay(3000);
}