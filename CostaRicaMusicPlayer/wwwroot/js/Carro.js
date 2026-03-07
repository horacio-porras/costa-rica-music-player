(() => {
    const Carro = {
        tabla: null,

        init() {
            this.inicializarTabla();
            this.registrarEventos();
            
        },
        inicializarTabla() {
            this.tabla = $('#tblCarro').DataTable({
                ajax: {
                    url: '/Carro/ObtenerCarros',
                    type: 'GET',
                    dataSrc:'data'
                },
                columns: [
                    { data: 'id' },
                    { data: 'marca'}, 
                    { data: 'modelo' },
                    {
                        data: null,
                        title: 'Acciones',
                        orderable: false, // No permitir ordenar por esta columna
                        render: function (data, type, row) {
                            return `
                                <button class="btn btn-sm btn-primary btn-editar" data-id="${row.id}">
                                    <i class="bi bi-pencil"></i> Editar
                                </button>
                                <button class="btn btn-sm btn-danger btn-eliminar" data-id="${row.id}">
                                    <i class="bi bi-trash"></i> Eliminar
                                </button>`;
                        }
                    }
                ],
                language: {
                    url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
                }
            });
        },
        registrarEventos() {
            
            $('#tblCarro').on('click', '.btn-editar', function () {
                const id = $(this).data('id');
                Carro.cargarDatosCarro(id);
            });

            $('#tblCarro').on('click', '.btn-eliminar', function () {
                const id = $(this).data('id');
                Carro.eliminarCarro(id);
            });


            //Crear            
            $('#btnGuardarCarro').on('click', function () {
                Carro.guardarCarro();

            });



            //Editar
            $('#btnEditarCarro').on('click', function () {
                Carro.editarCarro();

            });


        },
        guardarCarro() {
            let form = $('#formCrearCarro');

            if (!form.valid()) {
                return;
            }

            $.ajax({
                url: form.attr('action'), //GuardarCarro,
                type: 'POST',
                data: form.serialize(),
                success: function (response) {

                    if (response.esCorrecto) {

                        $('#modalCrearCarro').modal('hide');
                        form[0].reset();
                        Carro.tabla.ajax.reload(); //Recargar la tabla para mostrar el nuevo carro

                        Swal.fire({
                            title: 'Éxito',
                            text: response.mensaje,
                            icon: 'success',
                        });
                    }

                },
                error: function (error) {
                    Swal.fire({
                        title: 'Error',
                        text: error.responseJSON.description,
                        icon: 'Error',
                    });
                }
            });
        },
        cargarDatosCarro: function (id) {

            $.get(`/Carro/ObtenercarroPorId?id=${id}`, function (result) {
                //Espacios, para dividir el proceso
                if (result.esCorrecto) {
                    let data = result.data;                 //1. Cargar los datos
                    
                    $('#CarroId').val(data.id);             //2. Pintar los datos en el formulario
                    $('#Marca').val(data.marca);
                    $('#Modelo').val(data.modelo);

                    $('#modalEditarCarro').modal('show');   //3. Mostrar el modal

                }
            });
        },
        editarCarro: function () {
            let form = $('#formEditarCarro');

            if (!form.valid()) {
                return;
            }

            $.ajax({
                url: form.attr('action'), //GuardarCarro,
                type: 'POST',
                data: form.serialize(),
                success: function (response) {

                    if (response.esCorrecto) {

                        $('#modalEditarCarro').modal('hide');
                        form[0].reset();
                        Carro.tabla.ajax.reload(); //Recargar la tabla para mostrar el nuevo carro

                        Swal.fire({
                            title: 'Éxito',
                            text: response.mensaje,
                            icon: 'success',
                        });
                    }
                    else {
                        Swal.fire({
                            title: 'Error',
                            text: response.mensaje,
                            icon: 'warning',
                        });

                    }

                }
            });

        },
        eliminarCarro: function (id) {

            Swal.fire({
                title: '¿Estás seguro?',
                text: "¡No podrás revertir esta operación!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
            }).then((result) => {
                //Hasta que el usuario decida, no se ejecuta el código para eliminar

                if (result.isConfirmed) {

                    $.ajax({
                        url: '/Carro/EliminarCarro', //GuardarCarro,
                        type: 'POST',
                        data: {id:id},
                        success: function (response) {

                            if (response.esCorrecto) {

                                Carro.tabla.ajax.reload(); //Recargar la tabla para mostrar el nuevo carro

                                Swal.fire({
                                    title: 'Éxito',
                                    text: response.mensaje,
                                    icon: 'success',
                                });
                            }

                        }
                    });


                }


            });
                
                

        }

    };

    $(document).ready(() => Carro.init());

})(); //Encapsula el codigo y evita conflictos con otras librerias o codigos JS

