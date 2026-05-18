void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, 16, 17);
  Serial.println("Esperando numeros...");
}

void loop() {
  if (Serial2.available()) {
    String d = Serial2.readStringUntil('\n');
    d.trim();
    if (d.length() > 0) {
      int n = d.toInt();
      int r = n + 1;
      Serial2.println(r);
      Serial.print("Recibi: ");
      Serial.print(n);
      Serial.print(" -> devuelvo: ");
      Serial.println(r);
    }
  }
  delay(10);
}